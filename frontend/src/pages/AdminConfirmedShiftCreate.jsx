import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/api";

const RANGE_START = 0;
const RANGE_END = 24;
const TOTAL_HOURS = RANGE_END - RANGE_START;

function AdminConfirmedShiftCreate() {
	const [currentDate, setCurrentDate] = useState(null);
	const [periodId, setPeriodId] = useState(null);
	const [hallStaff, setHallStaff] = useState([]);
	const [kitchenStaff, setKitchenStaff] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selected, setSelected] = useState(null);
	const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

	function formatDate(date) {
		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, "0");
		const d = String(date.getDate()).padStart(2, "0");
		return `${y}-${m}-${d}`;
	}

	function formatDisplayDate(dateString) {
		const date = new Date(dateString);
		const days = ["日", "月", "火", "水", "木", "金", "土"];
		return `${date.getMonth() + 1}月${date.getDate()}日（${days[date.getDay()]}）`;
	}

	useEffect(() => {
		const handleResize = () => setIsMobile(window.innerWidth < 768);
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	useEffect(() => {
		fetchPeriod();
	}, []);

	useEffect(() => {
		if (currentDate) {
			fetchShiftsForDate(currentDate);
		}
	}, [currentDate]);

	const fetchPeriod = async () => {
		try {
			const response = await api.get("/api/submission-periods/current");
			setPeriodId(response.data.id);
			setCurrentDate(response.data.startDate);
		} catch (error) {
			console.error("提出期間の取得に失敗しました", error);
		}
	};

	const fetchShiftsForDate = async (date) => {
		setLoading(true);
		setSelected(null);

		try {
			const response = await api.get(`/api/shift-requests/date/${date}`);
			const shifts = response.data;

			const toStaffList = (list) =>
				list.map((shift) => {
					const start = timeToHour(shift.startTime);
					const end = timeToHour(shift.endTime);
					const original = [{ start, end }];
					return {
						userId: shift.userId,
						name: shift.displayName,
						original,
						blocks: JSON.parse(JSON.stringify(original)),
					};
				});

			setHallStaff(toStaffList(shifts.filter((s) => s.position === "HALL")));
			setKitchenStaff(
				toStaffList(shifts.filter((s) => s.position === "KITCHEN")),
			);
		} catch (error) {
			console.error("シフトの取得に失敗しました", error);
		} finally {
			setLoading(false);
		}
	};

	const timeToHour = (timeString) => {
		const [h, m] = timeString.split(":").map(Number);
		return h + m / 60;
	};

	const hourToTime = (hour) => {
		const h = Math.floor(hour);
		const m = Math.round((hour - h) * 60);
		return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
	};

	const hourToLabel = (hour) => {
		const h = Math.floor(hour);
		const m = Math.round((hour - h) * 60);
		return m === 0 ? `${h}:00` : `${h}:${m}`;
	};

	const goToPrevDay = () => {
		const date = new Date(currentDate);
		date.setDate(date.getDate() - 1);
		setCurrentDate(formatDate(date));
	};

	const goToNextDay = () => {
		const date = new Date(currentDate);
		date.setDate(date.getDate() + 1);
		setCurrentDate(formatDate(date));
	};

	const getStaffList = (position) =>
		position === "HALL" ? hallStaff : kitchenStaff;

	const setStaffList = (position, updater) => {
		if (position === "HALL") {
			setHallStaff(updater);
		} else {
			setKitchenStaff(updater);
		}
	};

	const updateBlocks = (position, userId, newBlocks) => {
		setStaffList(position, (prev) =>
			prev.map((s) => (s.userId === userId ? { ...s, blocks: newBlocks } : s)),
		);
	};

	const resetOne = (position, userId) => {
		setStaffList(position, (prev) =>
			prev.map((s) =>
				s.userId === userId
					? { ...s, blocks: JSON.parse(JSON.stringify(s.original)) }
					: s,
			),
		);
		setSelected(null);
	};

	const removeRow = (position, userId) => {
		setStaffList(position, (prev) => prev.filter((s) => s.userId !== userId));
		setSelected(null);
	};

	const resetAll = () => {
		setHallStaff((prev) =>
			prev.map((s) => ({
				...s,
				blocks: JSON.parse(JSON.stringify(s.original)),
			})),
		);
		setKitchenStaff((prev) =>
			prev.map((s) => ({
				...s,
				blocks: JSON.parse(JSON.stringify(s.original)),
			})),
		);
		setSelected(null);
	};

	const splitBlock = (position, userId, blockIndex) => {
		const staff = getStaffList(position).find((s) => s.userId === userId);
		const b = staff.blocks[blockIndex];
		if (b.end - b.start <= 1) return;

		const mid = Math.round(((b.start + b.end) / 2) * 2) / 2;
		const newBlocks = [...staff.blocks];
		newBlocks.splice(
			blockIndex,
			1,
			{ start: b.start, end: mid - 0.5 },
			{ start: mid + 0.5, end: b.end },
		);
		updateBlocks(position, userId, newBlocks);
		setSelected(null);
	};

	const deleteBlock = (position, userId, blockIndex) => {
		const staff = getStaffList(position).find((s) => s.userId === userId);
		const newBlocks = staff.blocks.filter((_, i) => i !== blockIndex);
		updateBlocks(position, userId, newBlocks);
		setSelected(null);
	};

	const handleSubmit = async () => {
		const allStaff = [...hallStaff, ...kitchenStaff];

		const requests = allStaff.flatMap((staff) =>
			staff.blocks.map((b) => ({
				userId: staff.userId,
				workDate: currentDate,
				startTime: hourToTime(b.start),
				endTime: hourToTime(b.end),
			})),
		);

		if (requests.length === 0) {
			alert("確定するシフトがありません。");
			return;
		}

		try {
			await api.post("/api/confirmed-shifts", {
				periodId,
				requests,
			});
			alert("確定シフトを保存しました！");
		} catch (error) {
			console.error("保存に失敗しました", error);
			alert("保存に失敗しました");
		}
	};

	if (loading || !currentDate) {
		return (
			<Layout title="管理者：確定シフト作成">
				<p>読み込み中...</p>
			</Layout>
		);
	}

	return (
		<Layout title="管理者：確定シフト作成">
			<div className="date-nav">
				<button type="button" onClick={goToPrevDay}>←</button>
				<span>{formatDisplayDate(currentDate)}</span>
				<button type="button" onClick={goToNextDay}>→</button>
			</div>

			<button type="button" onClick={resetAll} className="reset-all-button">
				全員リセット
			</button>

			<ShiftSection
				title="ホール"
				position="HALL"
				staffList={hallStaff}
				isMobile={isMobile}
				selected={selected}
				setSelected={setSelected}
				updateBlocks={updateBlocks}
				resetOne={resetOne}
				removeRow={removeRow}
				splitBlock={splitBlock}
				deleteBlock={deleteBlock}
				hourToLabel={hourToLabel}
			/>

			<ShiftSection
				title="キッチン"
				position="KITCHEN"
				staffList={kitchenStaff}
				isMobile={isMobile}
				selected={selected}
				setSelected={setSelected}
				updateBlocks={updateBlocks}
				resetOne={resetOne}
				removeRow={removeRow}
				splitBlock={splitBlock}
				deleteBlock={deleteBlock}
				hourToLabel={hourToLabel}
			/>

			<button type="button" onClick={handleSubmit} className="submit-button">
				確定シフトを保存
			</button>
		</Layout>
	);
}

function ShiftSection({
	title,
	position,
	staffList,
	isMobile,
	selected,
	setSelected,
	updateBlocks,
	resetOne,
	removeRow,
	splitBlock,
	deleteBlock,
	hourToLabel,
}) {
	if (staffList.length === 0) return null;

	return (
		<div className={`shift-section ${position === "KITCHEN" ? "kitchen" : ""}`}>
			<h3>{title}</h3>

			<div className="timeline-header">
				<div className="timeline-name-spacer" />
				<div className="timeline-hours">
					{Array.from({ length: TOTAL_HOURS }, (_, i) => RANGE_START + i).map(
						(h) => (
							<span key={h}>{h}</span>
						),
					)}
				</div>
			</div>

			{staffList.map((staff) => (
				<StaffRow
					key={staff.userId}
					position={position}
					staff={staff}
					isMobile={isMobile}
					selected={selected}
					setSelected={setSelected}
					updateBlocks={updateBlocks}
					resetOne={resetOne}
					removeRow={removeRow}
					splitBlock={splitBlock}
					deleteBlock={deleteBlock}
					hourToLabel={hourToLabel}
				/>
			))}
		</div>
	);
}

function StaffRow({
	position,
	staff,
	isMobile,
	selected,
	setSelected,
	updateBlocks,
	resetOne,
	removeRow,
	splitBlock,
	deleteBlock,
	hourToLabel,
}) {
	const hourToPct = (h) => ((h - RANGE_START) / TOTAL_HOURS) * 100;

	const clientXToHour = (clientX, trackEl) => {
		const rect = trackEl.getBoundingClientRect();
		const ratio = (clientX - rect.left) / rect.width;
		let hour = RANGE_START + ratio * TOTAL_HOURS;
		hour = Math.round(hour * 2) / 2;
		return Math.max(RANGE_START, Math.min(RANGE_END, hour));
	};

	const handleBarClick = (blockIndex) => {
		if (isMobile) {
			setSelected({ position, userId: staff.userId, blockIndex });
		}
	};

	const handleDoubleClick = (blockIndex) => {
		if (!isMobile) {
			splitBlock(position, staff.userId, blockIndex);
		}
	};

	const handleDragStart = (mode, blockIndex, e, trackEl) => {
		if (isMobile) return;
		e.preventDefault();
		e.stopPropagation();

		const block = staff.blocks[blockIndex];
		let dragOffset = 0;

		if (mode === "move") {
			const clientX = e.touches ? e.touches[0].clientX : e.clientX;
			dragOffset = clientXToHour(clientX, trackEl) - block.start;
		}

		const move = (moveEvent) => {
			const clientX = moveEvent.touches
				? moveEvent.touches[0].clientX
				: moveEvent.clientX;
			const hour = clientXToHour(clientX, trackEl);
			const newBlocks = [...staff.blocks];
			const b = { ...newBlocks[blockIndex] };

			if (mode === "move") {
				const duration = b.end - b.start;
				let newStart = hour - dragOffset;
				const prevEnd =
					blockIndex > 0 ? newBlocks[blockIndex - 1].end : RANGE_START;
				const nextStart =
					blockIndex < newBlocks.length - 1
						? newBlocks[blockIndex + 1].start
						: RANGE_END;
				newStart = Math.max(prevEnd, Math.min(nextStart - duration, newStart));
				b.start = newStart;
				b.end = newStart + duration;
			} else if (mode === "left") {
				const prevEnd =
					blockIndex > 0 ? newBlocks[blockIndex - 1].end : RANGE_START;
				b.start = Math.max(prevEnd, Math.min(hour, b.end - 0.5));
			} else if (mode === "right") {
				const nextStart =
					blockIndex < newBlocks.length - 1
						? newBlocks[blockIndex + 1].start
						: RANGE_END;
				b.end = Math.min(nextStart, Math.max(hour, b.start + 0.5));
			}

			newBlocks[blockIndex] = b;
			updateBlocks(position, staff.userId, newBlocks);
		};

		const stop = () => {
			window.removeEventListener("mousemove", move);
			window.removeEventListener("mouseup", stop);
			window.removeEventListener("touchmove", move);
			window.removeEventListener("touchend", stop);
		};

		window.addEventListener("mousemove", move);
		window.addEventListener("mouseup", stop);
		window.addEventListener("touchmove", move, { passive: false });
		window.addEventListener("touchend", stop);
	};

	const isBarSelected = (blockIndex) =>
		selected &&
		selected.position === position &&
		selected.userId === staff.userId &&
		selected.blockIndex === blockIndex;

	return (
		<div className="timeline-row">
			<div className="timeline-name">
				<span>{staff.name}</span>
				<div className="row-actions">
					<button type="button" onClick={() => resetOne(position, staff.userId)}>
						戻す
					</button>
					<button
						type="button"
						className="danger"
						onClick={() => removeRow(position, staff.userId)}
					>
						行削除
					</button>
				</div>
			</div>

			<div className="timeline-track">
				{staff.blocks.map((b, blockIndex) => (
					<div
						key={blockIndex}
						className={`timeline-bar ${isBarSelected(blockIndex) ? "selected" : ""}`}
						style={{
							left: `${hourToPct(b.start)}%`,
							width: `${hourToPct(b.end) - hourToPct(b.start)}%`,
						}}
						onClick={() => handleBarClick(blockIndex)}
						onDoubleClick={() => handleDoubleClick(blockIndex)}
						onMouseDown={(e) =>
							handleDragStart(
								"move",
								blockIndex,
								e,
								e.currentTarget.parentElement,
							)
						}
						onTouchStart={(e) =>
							handleDragStart(
								"move",
								blockIndex,
								e,
								e.currentTarget.parentElement,
							)
						}
					>
						<span className="bar-label">
							{hourToLabel(b.start)}〜{hourToLabel(b.end)}
						</span>

						{!isMobile && (
							<>
								<div
									className="resize-handle left"
									onMouseDown={(e) =>
										handleDragStart(
											"left",
											blockIndex,
											e,
											e.currentTarget.parentElement.parentElement,
										)
									}
								/>
								<div
									className="resize-handle right"
									onMouseDown={(e) =>
										handleDragStart(
											"right",
											blockIndex,
											e,
											e.currentTarget.parentElement.parentElement,
										)
									}
								/>
								<button
									type="button"
									className="bar-delete"
									onClick={(e) => {
										e.stopPropagation();
										deleteBlock(position, staff.userId, blockIndex);
									}}
								>
									×
								</button>
							</>
						)}
					</div>
				))}
			</div>

			{isMobile && (
				<MobilePanel
					position={position}
					staff={staff}
					selected={selected}
					setSelected={setSelected}
					updateBlocks={updateBlocks}
					splitBlock={splitBlock}
					deleteBlock={deleteBlock}
				/>
			)}
		</div>
	);
}

function MobilePanel({
	position,
	staff,
	selected,
	setSelected,
	updateBlocks,
	splitBlock,
	deleteBlock,
}) {
	const isThisRowSelected =
		selected &&
		selected.position === position &&
		selected.userId === staff.userId;

	if (!isThisRowSelected) return null;

	const blockIndex = selected.blockIndex;
	const block = staff.blocks[blockIndex];

	const hourOptions = [];
	for (let h = RANGE_START; h <= RANGE_END; h += 0.5) {
		hourOptions.push(h);
	}

	const handleStartChange = (value) => {
		const newBlocks = [...staff.blocks];
		newBlocks[blockIndex] = {
			...newBlocks[blockIndex],
			start: parseFloat(value),
		};
		updateBlocks(position, staff.userId, newBlocks);
	};

	const handleEndChange = (value) => {
		const newBlocks = [...staff.blocks];
		newBlocks[blockIndex] = {
			...newBlocks[blockIndex],
			end: parseFloat(value),
		};
		updateBlocks(position, staff.userId, newBlocks);
	};

	return (
		<div className="mobile-panel">
			<p>{staff.name}のシフト</p>
			<div className="mobile-panel-time">
				<select
					value={block.start}
					onChange={(e) => handleStartChange(e.target.value)}
				>
					{hourOptions.map((h) => (
						<option key={h} value={h}>
							{Math.floor(h)}:{h % 1 === 0 ? "00" : "30"}
						</option>
					))}
				</select>
				<span>〜</span>
				<select
					value={block.end}
					onChange={(e) => handleEndChange(e.target.value)}
				>
					{hourOptions.map((h) => (
						<option key={h} value={h}>
							{Math.floor(h)}:{h % 1 === 0 ? "00" : "30"}
						</option>
					))}
				</select>
			</div>
			<div className="mobile-panel-actions">
				<button
					type="button"
					onClick={() => splitBlock(position, staff.userId, blockIndex)}
				>
					分割
				</button>
				<button
					type="button"
					className="danger"
					onClick={() => deleteBlock(position, staff.userId, blockIndex)}
				>
					削除
				</button>
				<button type="button" onClick={() => setSelected(null)}>
					閉じる
				</button>
			</div>
		</div>
	);
}

export default AdminConfirmedShiftCreate;