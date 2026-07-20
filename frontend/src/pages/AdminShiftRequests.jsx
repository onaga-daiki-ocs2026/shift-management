import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../api/api";

const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

function AdminShiftRequests() {
	const [loading, setLoading] = useState(true);
	const [periodId, setPeriodId] = useState(null);
	const [dates, setDates] = useState([]);
	const [staffList, setStaffList] = useState([]); // [{userId, name, position}]
	const [matrix, setMatrix] = useState({}); // matrix[date][userId] = shift

	useEffect(() => {
		fetchAll();
	}, []);

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
			label: `${date.getMonth() + 1}/${date.getDate()}（${day}）`,
			isSun,
			isSat,
		};
	};

	const formatTime = (timeString) => {
		if (!timeString) return "";
		return timeString.slice(0, 5);
	};

	const fetchAll = async () => {
		try {
			const periodRes = await api.get("/api/submission-periods/current");
			const period = periodRes.data;
			setPeriodId(period.id);

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

			// スタッフ一覧を、初めて出てきた順（だいたいホール→キッチンの
			// 登録順）で組み立てつつ、日付×ユーザーIDのマトリクスも作る
			const staffMap = {};
			const newMatrix = {};
			results.forEach(({ date, shifts }) => {
				newMatrix[date] = {};
				shifts.forEach((shift) => {
					if (!staffMap[shift.userId]) {
						staffMap[shift.userId] = {
							userId: shift.userId,
							name: shift.displayName,
							position: shift.position,
						};
					}
					newMatrix[date][shift.userId] = shift;
				});
			});

			const sortedStaff = Object.values(staffMap).sort((a, b) => {
				if (a.position !== b.position) {
					return a.position === "HALL" ? -1 : 1;
				}
				return a.name.localeCompare(b.name, "ja");
			});

			setStaffList(sortedStaff);
			setMatrix(newMatrix);
		} catch (error) {
			console.error("データの取得に失敗しました", error);
		} finally {
			setLoading(false);
		}
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
			{staffList.length > 0 ? (
				<div className="requests-table-wrap">
					<table className="requests-table">
						<thead>
							<tr>
								<th className="requests-table-date-col">日付</th>
								{staffList.map((s) => (
									<th key={s.userId}>
										<span className="requests-table-staff-name">
											{s.name}
										</span>
										<span className="requests-table-staff-position">
											{s.position === "HALL" ? "ホール" : "キッチン"}
										</span>
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{dates.map((date) => {
								const { label, isSun, isSat } = formatDisplayDate(date);
								const dayShifts = matrix[date] || {};
								const availableCount = staffList.filter(
									(s) => dayShifts[s.userId]?.available,
								).length;
								const isThin = availableCount <= 1;

								return (
									<tr
										key={date}
										className={isThin ? "requests-table-row-thin" : ""}
									>
										<td
											className={`requests-table-date-col ${isSun ? "sun" : isSat ? "sat" : ""}`}
										>
											{label}
											<span className="requests-table-count">
												{availableCount}人
											</span>
										</td>
										{staffList.map((s) => {
											const shift = dayShifts[s.userId];
											return (
												<td key={s.userId}>
													{!shift ? (
														<span className="requests-table-empty">－</span>
													) : shift.available ? (
														<span className="requests-table-time">
															{formatTime(shift.startTime)}
															<br />〜{formatTime(shift.endTime)}
														</span>
													) : (
														<span className="requests-table-rest">休み</span>
													)}
												</td>
											);
										})}
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			) : (
				<div className="empty-state">
					<p className="empty-icon">👥</p>
					<p className="empty-text">希望シフトの提出はまだありません</p>
				</div>
			)}

			{periodId && staffList.length > 0 && (
				<Link
					to="/admin/confirmed-shifts/create"
					className="submit-button requests-table-cta"
				>
					この期間の確定シフトを作成する
				</Link>
			)}
		</Layout>
	);
}

export default AdminShiftRequests;
