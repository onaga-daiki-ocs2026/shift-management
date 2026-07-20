import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/api";

const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];
const MAX_BLOCKS = 5;

function MySubmissions() {
	const [shifts, setShifts] = useState([]);
	const [openBlockIndexes, setOpenBlockIndexes] = useState(new Set());
	const [loading, setLoading] = useState(true);
	const [viewMode, setViewMode] = useState("list"); // "list" | "calendar"
	const [calendarMonth, setCalendarMonth] = useState(() => {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth(), 1);
	});

	useEffect(() => {
		const loginUser = JSON.parse(localStorage.getItem("loginUser"));
		const userId = loginUser?.id;

		api
			.get(`/api/shift-requests/user/${userId}`)
			.then((response) => {
				setShifts(response.data);
			})
			.catch((error) => {
				console.log(error);
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	const toggleBlock = (blockIndex) => {
		setOpenBlockIndexes((prev) => {
			const next = new Set(prev);
			if (next.has(blockIndex)) {
				next.delete(blockIndex);
			} else {
				next.add(blockIndex);
			}
			return next;
		});
	};

	const groupByBlock = (shifts) => {
		const sorted = [...shifts].sort((a, b) =>
			a.workDate.localeCompare(b.workDate),
		);
		const blocks = [];
		for (let i = 0; i < sorted.length; i += 14) {
			const dates = sorted.slice(i, i + 14);
			blocks.push({ dates });
		}
		// 新しい期間が上に来るよう並び替えて、直近5件までに絞る
		return blocks.reverse().slice(0, MAX_BLOCKS);
	};

	const formatDisplayDate = (dateString) => {
		const date = new Date(dateString);
		const day = DAY_NAMES[date.getDay()];
		const isSun = date.getDay() === 0;
		const isSat = date.getDay() === 6;
		return { label: `${date.getMonth() + 1}/${date.getDate()}（${day}）`, isSun, isSat };
	};

	const formatBlockRange = (dates) => {
		const start = new Date(dates[0].workDate);
		const end = new Date(dates[dates.length - 1].workDate);
		return `${start.getMonth() + 1}月${start.getDate()}日（${DAY_NAMES[start.getDay()]}）〜${end.getMonth() + 1}月${end.getDate()}日（${DAY_NAMES[end.getDay()]}）`;
	};

	const formatTime = (timeString) => {
		if (!timeString) return "";
		return timeString.slice(0, 5);
	};

	// yyyy-mm-dd 文字列を作る（ローカル日付基準、UTCズレを避ける）
	const toDateKey = (date) => {
		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, "0");
		const d = String(date.getDate()).padStart(2, "0");
		return `${y}-${m}-${d}`;
	};

	// workDate（yyyy-mm-dd）→ シフト情報 の早引きマップ
	const shiftsByDate = shifts.reduce((map, shift) => {
		map[shift.workDate] = shift;
		return map;
	}, {});

	const goToPrevMonth = () => {
		setCalendarMonth(
			(prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
		);
	};

	const goToNextMonth = () => {
		setCalendarMonth(
			(prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
		);
	};

	// カレンダーグリッド用の日付配列（前後の月の空白マスも含む、6週間分）
	const buildCalendarCells = (monthDate) => {
		const year = monthDate.getFullYear();
		const month = monthDate.getMonth();
		const firstDay = new Date(year, month, 1);
		const startOffset = firstDay.getDay(); // 0=日曜始まり
		const gridStart = new Date(year, month, 1 - startOffset);

		const cells = [];
		for (let i = 0; i < 42; i++) {
			const date = new Date(gridStart);
			date.setDate(gridStart.getDate() + i);
			cells.push(date);
		}
		return cells;
	};

	const blocks = groupByBlock(shifts);
	const calendarCells = buildCalendarCells(calendarMonth);

	if (loading) {
		return (
			<Layout>
				<p className="loading-text">読み込み中...</p>
			</Layout>
		);
	}

	return (
		<Layout>
			<div className="view-toggle">
				<button
					type="button"
					className={`view-toggle-btn ${viewMode === "list" ? "active" : ""}`}
					onClick={() => setViewMode("list")}
				>
					📋 リスト
				</button>
				<button
					type="button"
					className={`view-toggle-btn ${viewMode === "calendar" ? "active" : ""}`}
					onClick={() => setViewMode("calendar")}
				>
					📅 カレンダー
				</button>
			</div>

			{viewMode === "calendar" ? (
				<div className="calendar-area">
					<div className="calendar-nav">
						<button type="button" onClick={goToPrevMonth}>
							‹
						</button>
						<span className="calendar-month-label">
							{calendarMonth.getFullYear()}年{calendarMonth.getMonth() + 1}月
						</span>
						<button type="button" onClick={goToNextMonth}>
							›
						</button>
					</div>

					<div className="calendar-weekday-row">
						{DAY_NAMES.map((d, i) => (
							<div
								key={d}
								className={`calendar-weekday ${i === 0 ? "sun" : i === 6 ? "sat" : ""}`}
							>
								{d}
							</div>
						))}
					</div>

					<div className="calendar-grid">
						{calendarCells.map((date) => {
							const dateKey = toDateKey(date);
							const isCurrentMonth =
								date.getMonth() === calendarMonth.getMonth();
							const shift = shiftsByDate[dateKey];
							const dayOfWeek = date.getDay();

							return (
								<div
									key={dateKey}
									className={`calendar-cell ${isCurrentMonth ? "" : "outside-month"}`}
								>
									<div
										className={`calendar-date-num ${dayOfWeek === 0 ? "sun" : dayOfWeek === 6 ? "sat" : ""}`}
									>
										{date.getDate()}
									</div>
									{shift ? (
										shift.available ? (
											<div className="calendar-shift-time">
												{formatTime(shift.startTime)}
												<br />〜{formatTime(shift.endTime)}
											</div>
										) : (
											<div className="calendar-shift-rest">休み</div>
										)
									) : (
										isCurrentMonth && (
											<div className="calendar-shift-empty">―</div>
										)
									)}
								</div>
							);
						})}
					</div>

					<div className="calendar-legend">
						<span>
							<span className="calendar-legend-dot work" />
							出勤（時間表示）
						</span>
						<span>
							<span className="calendar-legend-dot rest" />
							休み
						</span>
					</div>
				</div>
			) : blocks.length > 0 ? (
				<div>
					<p className="pdf-note">提出済みシフト（直近5件）</p>

					{blocks.map((block, blockIndex) => {
						const isOpen = openBlockIndexes.has(blockIndex);
						const availableCount = block.dates.filter((d) => d.available).length;

						return (
							<div key={blockIndex} className="shift-block">
								<div className="block-header">
									<div className="block-header-left">
										<span className="block-calendar-icon">📅</span>
										<span className="block-range">{formatBlockRange(block.dates)}</span>
									</div>
									<div className="block-header-right">
										<span className="available-badge">
											出勤可能 {availableCount}日
										</span>
										<button
											type="button"
											className="accordion-toggle"
											onClick={() => toggleBlock(blockIndex)}
										>
											{isOpen ? "︿" : "﹀"}
										</button>
									</div>
								</div>

								{isOpen && (
									<div className="accordion-content">
										<div className="shift-table-header">
											<span className="shift-date-col" />
											<span className="shift-col-label">状態</span>
											<span className="shift-col-label">時間</span>
										</div>

										{block.dates.map((shift) => {
											const { label, isSun, isSat } = formatDisplayDate(shift.workDate);
											return (
												<div key={shift.workDate} className="submission-row">
													<div className={`shift-date ${isSun ? "sun" : isSat ? "sat" : ""}`}>
														{label}
													</div>
													<div className="submission-status">
														{shift.available ? (
															<span className="status-available">出勤可</span>
														) : (
															<span className="status-rest">休み</span>
														)}
													</div>
													<div className="submission-time">
														{shift.available
															? `${formatTime(shift.startTime)}〜${formatTime(shift.endTime)}`
															: "－"}
													</div>
												</div>
											);
										})}
									</div>
								)}
							</div>
						);
					})}

					<div className="pdf-inquiry-note">
						これより前のシフトを確認したい場合は、店舗の管理者にお問い合わせください。
					</div>
				</div>
			) : (
				<div className="empty-state">
					<p className="empty-icon">📋</p>
					<p className="empty-text">提出済みシフトはありません</p>
				</div>
			)}
		</Layout>
	);
}

export default MySubmissions;
