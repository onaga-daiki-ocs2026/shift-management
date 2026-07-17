import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/api";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const RANGE_START = 0;
const RANGE_END = 24;
const TOTAL_HOURS = RANGE_END - RANGE_START;
const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

function AdminConfirmedShiftCreate() {
	const [periodId, setPeriodId] = useState(null);
	const [periodStart, setPeriodStart] = useState(null);
	const [dates, setDates] = useState([]);
	const [dayStaffMap, setDayStaffMap] = useState({});
	const [loading, setLoading] = useState(true);
	const [selected, setSelected] = useState(null);
	const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
	const [exporting, setExporting] = useState(false);
	const [currentWeek, setCurrentWeek] = useState(0); // 0=前半, 1=後半
	const [dayMemoMap, setDayMemoMap] = useState({});
	const [dayNoteMap, setDayNoteMap] = useState({}); // { "2026-07-05": "10時オープン" }

	const updateDayNote = (date, value) => {
		setDayNoteMap((prev) => ({ ...prev, [date]: value }));
	};

	useEffect(() => {
		const handleResize = () => setIsMobile(window.innerWidth < 768);
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	useEffect(() => {
		fetchPeriodAndShifts();
	}, []);

	const fetchPeriodAndShifts = async () => {
		try {
			const response = await api.get("/api/submission-periods/current");
			const period = response.data;
			setPeriodId(period.id);
			setPeriodStart(period.startDate);

			const startDate = new Date(period.startDate);
			const dateList = [];
			for (let i = 0; i < 14; i++) {
				const d = new Date(startDate);
				d.setDate(startDate.getDate() + i);
				dateList.push(formatDate(d));
			}
			setDates(dateList);

			const results = await Promise.all(
				dateList.map((date) =>
					api
						.get(`/api/shift-requests/date/${date}`)
						.then((res) => ({ date, shifts: res.data }))
						.catch(() => ({ date, shifts: [] })),
				),
			);

			const map = {};
			results.forEach(({ date, shifts }) => {
				const toStaffList = (list) =>
					list.map((shift) => {
						const start = timeToHour(shift.startTime);
						const end = timeToHour(shift.endTime);
						const original = [{ start, end }];
						return {
							userId: shift.userId,
							name: shift.displayName,
							comment: shift.comment || "",
							role: "",
							original,
							blocks: JSON.parse(JSON.stringify(original)),
						};
					});

				map[date] = {
					hall: toStaffList(shifts.filter((s) => s.position === "HALL")),
					kitchen: toStaffList(
						shifts.filter((s) => s.position === "KITCHEN"),
					),
				};
			});

			setDayStaffMap(map);
		} catch (error) {
			console.error("提出期間の取得に失敗しました", error);
		} finally {
			setLoading(false);
		}
	};

	const formatDate = (date) => {
		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, "0");
		const d = String(date.getDate()).padStart(2, "0");
		return `${y}-${m}-${d}`;
	};

	const formatDisplayDate = (dateString) => {
		const date = new Date(dateString);
		const day = DAY_NAMES[date.getDay()];
		const isSun = date.getDay() === 0;
		const isSat = date.getDay() === 6;
		return {
			label: `${date.getMonth() + 1}月${date.getDate()}日（${day}）`,
			isSun,
			isSat,
		};
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

	const getStaffList = (date, position) =>
		dayStaffMap[date]?.[position === "HALL" ? "hall" : "kitchen"] ?? [];

	const updateBlocks = (date, position, userId, newBlocks) => {
		const key = position === "HALL" ? "hall" : "kitchen";
		setDayStaffMap((prev) => ({
			...prev,
			[date]: {
				...prev[date],
				[key]: prev[date][key].map((s) =>
					s.userId === userId ? { ...s, blocks: newBlocks } : s,
				),
			},
		}));
	};

	const updateRole = (date, position, userId, role) => {
		const key = position === "HALL" ? "hall" : "kitchen";
		setDayStaffMap((prev) => ({
			...prev,
			[date]: {
				...prev[date],
				[key]: prev[date][key].map((s) =>
					s.userId === userId ? { ...s, role } : s,
				),
			},
		}));
	};

	const updateDayMemo = (date, memo) => {
		setDayMemoMap((prev) => ({ ...prev, [date]: memo }));
	};

	const resetOne = (date, position, userId) => {
		const key = position === "HALL" ? "hall" : "kitchen";
		setDayStaffMap((prev) => ({
			...prev,
			[date]: {
				...prev[date],
				[key]: prev[date][key].map((s) =>
					s.userId === userId
						? { ...s, blocks: JSON.parse(JSON.stringify(s.original)) }
						: s,
				),
			},
		}));
		setSelected(null);
	};

	const removeRow = (date, position, userId) => {
		const key = position === "HALL" ? "hall" : "kitchen";
		setDayStaffMap((prev) => ({
			...prev,
			[date]: {
				...prev[date],
				[key]: prev[date][key].filter((s) => s.userId !== userId),
			},
		}));
		setSelected(null);
	};

	const resetAll = () => {
		setDayStaffMap((prev) => {
			const next = {};
			Object.entries(prev).forEach(([date, { hall, kitchen }]) => {
				next[date] = {
					hall: hall.map((s) => ({
						...s,
						blocks: JSON.parse(JSON.stringify(s.original)),
					})),
					kitchen: kitchen.map((s) => ({
						...s,
						blocks: JSON.parse(JSON.stringify(s.original)),
					})),
				};
			});
			return next;
		});
		setSelected(null);
	};

	const splitBlock = (date, position, userId, blockIndex) => {
		const staff = getStaffList(date, position).find(
			(s) => s.userId === userId,
		);
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
		updateBlocks(date, position, userId, newBlocks);
		setSelected(null);
	};

	const deleteBlock = (date, position, userId, blockIndex) => {
		const staff = getStaffList(date, position).find(
			(s) => s.userId === userId,
		);
		const newBlocks = staff.blocks.filter((_, i) => i !== blockIndex);
		updateBlocks(date, position, userId, newBlocks);
		setSelected(null);
	};

	const handleSubmit = async () => {
		const requests = [];
		dates.forEach((date) => {
			const allStaff = [
				...getStaffList(date, "HALL"),
				...getStaffList(date, "KITCHEN"),
			];
			allStaff.forEach((staff) => {
				staff.blocks.forEach((b) => {
					requests.push({
						userId: staff.userId,
						workDate: date,
						startTime: hourToTime(b.start),
						endTime: hourToTime(b.end),
					});
				});
			});
		});

		if (requests.length === 0) {
			alert("確定するシフトがありません。");
			return;
		}

		try {
			await api.post("/api/confirmed-shifts", { periodId, requests });
			alert("14日分の確定シフトを保存しました！");
		} catch (error) {
			console.error("保存に失敗しました", error);
			alert("保存に失敗しました");
		}
	};

	const handleExportPdf = async () => {
		setExporting(true);
		setSelected(null);
		const element = document.getElementById("pdf-export-area");
		element.classList.add("pdf-mode");
		try {
			const canvas = await html2canvas(element, {
				scale: 1,
				useCORS: true,
				backgroundColor: "#ffffff",
			});

			const imgData = canvas.toDataURL("image/png");
			const pdf = new jsPDF("landscape", "mm", "a4");
			const pdfWidth = pdf.internal.pageSize.getWidth();
			const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
			pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

			const pdfBlob = pdf.output("blob");
			const formData = new FormData();
			formData.append("file", pdfBlob, "shift.pdf");
			formData.append("periodStart", periodStart);

			await api.post("/api/pdfs/upload", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			alert("PDFを保存しました！スタッフの確定シフト確認画面に反映されます。");
		} catch (error) {
			console.error("PDF出力に失敗しました", error);
			alert("PDF出力に失敗しました");
		} finally {
			element.classList.remove("pdf-mode");
			setExporting(false);
		}
	};

	const displayDates = dates.filter((_, i) =>
		currentWeek === 0 ? i < 7 : i >= 7
	);

	const selectedStaff = selected
		? getStaffList(selected.date, selected.position).find(
				(s) => s.userId === selected.userId,
			)
		: null;

	if (loading) {
		return (
			<Layout>
				<p className="loading-text">読み込み中...</p>
			</Layout>
		);
	}

	return (
		<>
		<Layout>
			<div className="confirmed-create-toolbar">
				<button
					type="button"
					onClick={resetAll}
					className="reset-all-button"
				>
					全員リセット
				</button>
			</div>

			<div className="week-tabs">
				<button
					type="button"
					className={`week-tab ${currentWeek === 0 ? "active" : ""}`}
					onClick={() => setCurrentWeek(0)}
				>
					前半（1〜7日目）
				</button>
				<button
					type="button"
					className={`week-tab ${currentWeek === 1 ? "active" : ""}`}
					onClick={() => setCurrentWeek(1)}
				>
					後半（8〜14日目）
				</button>
			</div>

			<div id="pdf-export-area">
				{dates.map((date) => {
					const { label, isSun, isSat } = formatDisplayDate(date);
					const hallList = getStaffList(date, "HALL");
					const kitchenList = getStaffList(date, "KITCHEN");

					return (
						<div key={date} className="day-section">
							<div
								className={`day-section-title ${isSun ? "sun" : isSat ? "sat" : ""}`}
							>
								{label}
							</div>

							<ShiftSection
								title="ホール"
								position="HALL"
								date={date}
								staffList={hallList}
								isMobile={isMobile}
								selected={selected}
								setSelected={setSelected}
								updateBlocks={updateBlocks}
								updateRole={updateRole}
								resetOne={resetOne}
								removeRow={removeRow}
								splitBlock={splitBlock}
								deleteBlock={deleteBlock}
								hourToLabel={hourToLabel}
							/>
							<ShiftSection
								title="キッチン"
								position="KITCHEN"
								date={date}
								staffList={kitchenList}
								isMobile={isMobile}
								selected={selected}
								setSelected={setSelected}
								updateBlocks={updateBlocks}
								updateRole={updateRole}
								resetOne={resetOne}
								removeRow={removeRow}
								splitBlock={splitBlock}
								deleteBlock={deleteBlock}
								hourToLabel={hourToLabel}
							/>

							<div className="day-memo-area">
								<span className="day-memo-label">伝達事項</span>
								<textarea
									className="day-memo-textarea"
									placeholder="この日の伝達事項を入力（例：10時オープン）"
									value={dayMemoMap[date] || ""}
									onChange={(e) => updateDayMemo(date, e.target.value)}
								/>
							</div>
						</div>
					);
				})}
			</div>

			{/* PDF印刷用（非表示） */}
			<div
				id="pdf-print-area"
				style={{
					position: "fixed",
					top: "-9999px",
					left: "-9999px",
					width: "1120px",
					background: "#fff",
					padding: "24px",
				}}
			>
				{dates.map((date) => {
					const { label } = formatDisplayDate(date);
					const hallList = getStaffList(date, "HALL");
					const kitchenList = getStaffList(date, "KITCHEN");
					if (hallList.length === 0 && kitchenList.length === 0) return null;

					return (
						<div key={date} style={{ marginBottom: "16px" }}>
							<h3 style={{ fontSize: "13px", margin: "0 0 4px 0" }}>
								{label}
							</h3>
							{hallList.length > 0 && (
								<ShiftSection
									title="ホール"
									position="HALL"
									date={date}
									staffList={hallList}
									isMobile={false}
									selected={null}
									setSelected={() => {}}
									updateBlocks={() => {}}
									resetOne={() => {}}
									removeRow={() => {}}
									splitBlock={() => {}}
									deleteBlock={() => {}}
									hourToLabel={hourToLabel}
								/>
							)}
							{kitchenList.length > 0 && (
								<ShiftSection
									title="キッチン"
									position="KITCHEN"
									date={date}
									staffList={kitchenList}
									isMobile={false}
									selected={null}
									setSelected={() => {}}
									updateBlocks={() => {}}
									resetOne={() => {}}
									removeRow={() => {}}
									splitBlock={() => {}}
									deleteBlock={() => {}}
									hourToLabel={hourToLabel}
								/>
							)}
						</div>
					);
				})}
			</div>

			<div className="confirmed-create-bottom-actions">
				<button
					type="button"
					onClick={handleSubmit}
					className="submit-button"
				>
					確定シフトを保存
				</button>
				<button
					type="button"
					className="pdf-export-button"
					onClick={handleExportPdf}
					disabled={exporting}
				>
					{exporting ? "PDF生成中..." : "📄 PDFを生成・公開"}
				</button>
			</div>
		</Layout>

		{!isMobile && selected && selectedStaff && (
			<EditModal
				date={selected.date}
				position={selected.position}
				staff={selectedStaff}
				blockIndex={selected.blockIndex}
				updateBlocks={updateBlocks}
				splitBlock={splitBlock}
				deleteBlock={deleteBlock}
				setSelected={setSelected}
			/>
		)}
		</>
	);
}

const FIXED_ROWS_PER_SECTION = 15;

function ShiftSection({
	title,
	position,
	date,
	staffList,
	isMobile,
	selected,
	setSelected,
	updateBlocks,
	updateRole,
	resetOne,
	removeRow,
	splitBlock,
	deleteBlock,
	hourToLabel,
}) {
	const totalHours = staffList.reduce((sum, staff) => {
		const staffTotal = staff.blocks.reduce(
			(s, b) => s + (b.end - b.start),
			0,
		);
		return sum + staffTotal;
	}, 0);

	const emptyRowCount = Math.max(
		0,
		FIXED_ROWS_PER_SECTION - staffList.length,
	);

	return (
		<div
			className={`shift-section ${position === "KITCHEN" ? "kitchen" : ""}`}
		>
			<h3>{title}</h3>

			<div className="timeline-header">
				<div className="timeline-role-spacer">役割</div>
				<div className="timeline-name-spacer">氏名</div>
				<div className="timeline-hours">
					{Array.from(
						{ length: TOTAL_HOURS },
						(_, i) => RANGE_START + i,
					).map((h) => (
						<span key={h}>{h}</span>
					))}
				</div>
				<div className="timeline-hours-time">計画</div>
				<div className="timeline-icon-spacer" />
			</div>

			{staffList.map((staff) => (
				<StaffRow
					key={staff.userId}
					date={date}
					position={position}
					staff={staff}
					isMobile={isMobile}
					selected={selected}
					setSelected={setSelected}
					updateBlocks={updateBlocks}
					updateRole={updateRole}
					resetOne={resetOne}
					removeRow={removeRow}
					splitBlock={splitBlock}
					deleteBlock={deleteBlock}
					hourToLabel={hourToLabel}
				/>
			))}

			{Array.from({ length: emptyRowCount }, (_, i) => (
				<EmptyRow key={`empty-${i}`} />
			))}

			<div className="section-total">
				合計：<span>{totalHours.toFixed(1)}h</span>
			</div>
		</div>
	);
}

function EmptyRow() {
	return (
		<div className="timeline-row empty-row">
			<div className="timeline-role" />
			<div className="timeline-name" />
			<div className="timeline-track" />
			<div className="timeline-hours-time" />
			<div className="row-icon-actions" />
		</div>
	);
}

function StaffRow({
	date,
	position,
	staff,
	isMobile,
	selected,
	setSelected,
	updateBlocks,
	updateRole,
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
		setSelected({ date, position, userId: staff.userId, blockIndex });
	};

	const handleDoubleClick = (blockIndex) => {
		if (!isMobile) {
			splitBlock(date, position, staff.userId, blockIndex);
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
				newStart = Math.max(
					prevEnd,
					Math.min(nextStart - duration, newStart),
				);
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
			updateBlocks(date, position, staff.userId, newBlocks);
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
		selected.date === date &&
		selected.position === position &&
		selected.userId === staff.userId &&
		selected.blockIndex === blockIndex;

	return (
		<div className="timeline-row">
			<div className="timeline-role">
				<select
					className="role-input"
					value={staff.role || ""}
					onChange={(e) =>
						updateRole(date, position, staff.userId, e.target.value)
					}
				>
					<option value=""></option>
					<option value="指導">指導</option>
					<option value="仕込">仕込</option>
					<option value="研修">研修</option>
				</select>
			</div>
			<div className="timeline-name">
				<span>
					{staff.name}
					{staff.comment && (
						<span
							className="comment-icon"
							title={`コメント：${staff.comment}`}
						>
							💬
						</span>
					)}
				</span>
				<span className="staff-position">
					{position === "HALL" ? "ホール" : "キッチン"}
				</span>
			</div>

			<div className="timeline-track">
				{staff.blocks.map((b, blockIndex) => {
					return (
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
											deleteBlock(
												date,
												position,
												staff.userId,
												blockIndex,
											);
										}}
									>
										×
									</button>
								</>
							)}
						</div>
					);
				})}
			</div>

			<div className="timeline-hours-time">
				{staff.blocks
					.reduce((sum, b) => sum + (b.end - b.start), 0)
					.toFixed(1)}
				h
			</div>

			<div className="row-icon-actions">
				<button
					type="button"
					title="戻す"
					onClick={() => resetOne(date, position, staff.userId)}
				>
					↺
				</button>
				<button
					type="button"
					className="danger"
					title="削除"
					onClick={() => removeRow(date, position, staff.userId)}
				>
					✕
				</button>
			</div>

			{isMobile && (
				<MobilePanel
					date={date}
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
	date,
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
		selected.date === date &&
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
		updateBlocks(date, position, staff.userId, newBlocks);
	};

	const handleEndChange = (value) => {
		const newBlocks = [...staff.blocks];
		newBlocks[blockIndex] = {
			...newBlocks[blockIndex],
			end: parseFloat(value),
		};
		updateBlocks(date, position, staff.userId, newBlocks);
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
					onClick={() =>
						splitBlock(date, position, staff.userId, blockIndex)
					}
				>
					分割
				</button>
				<button
					type="button"
					className="danger"
					onClick={() =>
						deleteBlock(date, position, staff.userId, blockIndex)
					}
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

function EditModal({
	date,
	position,
	staff,
	blockIndex,
	updateBlocks,
	splitBlock,
	deleteBlock,
	setSelected,
}) {
	const block = staff.blocks[blockIndex];

	const hourOptions = [];
	for (let h = RANGE_START; h <= RANGE_END; h += 0.5) {
		hourOptions.push(h);
	}

	const hourToLabel = (hour) => {
		const h = Math.floor(hour);
		const m = Math.round((hour - h) * 60);
		return m === 0 ? `${h}:00` : `${h}:${m}`;
	};

	const handleStartChange = (value) => {
		const newBlocks = [...staff.blocks];
		newBlocks[blockIndex] = {
			...newBlocks[blockIndex],
			start: parseFloat(value),
		};
		updateBlocks(date, position, staff.userId, newBlocks);
	};

	const handleEndChange = (value) => {
		const newBlocks = [...staff.blocks];
		newBlocks[blockIndex] = {
			...newBlocks[blockIndex],
			end: parseFloat(value),
		};
		updateBlocks(date, position, staff.userId, newBlocks);
	};

	return (
		<div className="edit-modal-overlay" onClick={() => setSelected(null)}>
			<div className="edit-modal" onClick={(e) => e.stopPropagation()}>
				<div className="edit-modal-header">
					<span>
						{staff.name}
						<span className="edit-modal-position">
							（{position === "HALL" ? "ホール" : "キッチン"}）
						</span>
					</span>
					<button
						type="button"
						className="edit-modal-close-x"
						onClick={() => setSelected(null)}
					>
						×
					</button>
				</div>

				<div className="edit-modal-body">
					<div className="edit-modal-time">
						<div className="edit-modal-time-group">
							<label>開始時刻</label>
							<select
								value={block.start}
								onChange={(e) => handleStartChange(e.target.value)}
							>
								{hourOptions.map((h) => (
									<option key={h} value={h}>
										{hourToLabel(h)}
									</option>
								))}
							</select>
						</div>
						<span className="edit-modal-tilde">〜</span>
						<div className="edit-modal-time-group">
							<label>終了時刻</label>
							<select
								value={block.end}
								onChange={(e) => handleEndChange(e.target.value)}
							>
								{hourOptions.map((h) => (
									<option key={h} value={h}>
										{hourToLabel(h)}
									</option>
								))}
							</select>
						</div>
					</div>
				</div>

				<div className="edit-modal-actions">
					<button
						type="button"
						className="edit-modal-btn edit-modal-btn-split"
						onClick={() =>
							splitBlock(date, position, staff.userId, blockIndex)
						}
					>
						分割
					</button>
					<button
						type="button"
						className="edit-modal-btn edit-modal-btn-delete"
						onClick={() =>
							deleteBlock(date, position, staff.userId, blockIndex)
						}
					>
						削除
					</button>
					<button
						type="button"
						className="edit-modal-btn edit-modal-btn-close"
						onClick={() => setSelected(null)}
					>
						閉じる
					</button>
				</div>
			</div>
		</div>
	);
}

export default AdminConfirmedShiftCreate;
