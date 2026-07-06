import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/api";

const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

function AdminShiftRequests() {
	const [staffShifts, setStaffShifts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [openIndexes, setOpenIndexes] = useState(new Set([0]));

	useEffect(() => {
		fetchAll();
	}, []);

	const fetchAll = async () => {
		try {
			const usersRes = await api.get("/api/users");
			const users = usersRes.data;

			const results = await Promise.all(
				users.map(async (user) => {
					const shiftsRes = await api
						.get(`/api/shift-requests/user/${user.id}`)
						.catch(() => ({ data: [] }));
					return {
						userId: user.id,
						displayName: user.displayName,
						position: user.position,
						shifts: shiftsRes.data.sort((a, b) =>
							a.workDate.localeCompare(b.workDate),
						),
					};
				}),
			);

			// シフト提出がある人だけ表示
			setStaffShifts(results.filter((s) => s.shifts.length > 0));
		} catch (error) {
			console.error("データの取得に失敗しました", error);
		} finally {
			setLoading(false);
		}
	};

	const toggleIndex = (index) => {
		setOpenIndexes((prev) => {
			const next = new Set(prev);
			if (next.has(index)) {
				next.delete(index);
			} else {
				next.add(index);
			}
			return next;
		});
	};

	const formatDisplayDate = (dateString) => {
		const date = new Date(dateString);
		const day = DAY_NAMES[date.getDay()];
		const isSun = date.getDay() === 0;
		const isSat = date.getDay() === 6;
		return {
			label: `${date.getMonth() + 1}/${date.getDate()}（${day}）`,
			isSun,
			isSat,
		};
	};

	const formatTime = (timeString) => {
		if (!timeString) return "";
		return timeString.slice(0, 5);
	};

	const formatBlockRange = (shifts) => {
		if (shifts.length === 0) return "";
		const start = new Date(shifts[0].workDate);
		const end = new Date(shifts[shifts.length - 1].workDate);
		return `${start.getMonth() + 1}月${start.getDate()}日〜${end.getMonth() + 1}月${end.getDate()}日`;
	};

	if (loading) {
		return (
			<Layout>
				<p className="loading-text">読み込み中...</p>
			</Layout>
		);
	}

	return (
		<Layout>
			{staffShifts.length > 0 ? (
				<div>
					{staffShifts.map((staff, index) => {
						const isOpen = openIndexes.has(index);
						const availableCount = staff.shifts.filter(
							(s) => s.available,
						).length;

						return (
							<div key={staff.userId} className="shift-block">
								<div className="block-header">
									<div className="block-header-left">
										<span className="block-calendar-icon">
											{staff.position === "HALL" ? "🍽️" : "👨‍🍳"}
										</span>
										<div>
											<div className="block-range">{staff.displayName}</div>
											<div className="staff-shift-range">
												{formatBlockRange(staff.shifts)}
											</div>
										</div>
									</div>
									<div className="block-header-right">
										<span className="available-badge">
											出勤可 {availableCount}日
										</span>
										<button
											type="button"
											className="accordion-toggle"
											onClick={() => toggleIndex(index)}
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

										{staff.shifts.map((shift) => {
											const { label, isSun, isSat } =
												formatDisplayDate(shift.workDate);
											return (
												<div
													key={shift.workDate}
													className="submission-row"
												>
													<div
														className={`shift-date ${isSun ? "sun" : isSat ? "sat" : ""}`}
													>
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
					<p className="empty-icon">👥</p>
					<p className="empty-text">希望シフトの提出はまだありません</p>
				</div>
			)}
		</Layout>
	);
}

export default AdminShiftRequests;