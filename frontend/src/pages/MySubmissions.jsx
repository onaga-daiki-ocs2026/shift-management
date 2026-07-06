import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/api";

const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

function MySubmissions() {
	const [shifts, setShifts] = useState([]);
	const [openBlockIndexes, setOpenBlockIndexes] = useState(new Set([0]));
	const [loading, setLoading] = useState(true);

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
		return blocks;
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

	const blocks = groupByBlock(shifts);

	if (loading) {
		return (
			<Layout>
				<p className="loading-text">読み込み中...</p>
			</Layout>
		);
	}

	return (
		<Layout>
			{blocks.length > 0 ? (
				<div>
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