import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../api/api";

const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];
const POSITION_STORAGE_KEY = "adminShiftRequestsPosition";
const POSITIONS = ["HALL", "KITCHEN"];
const POSITION_LABEL = { HALL: "ホール", KITCHEN: "キッチン" };

const VIEW_MODE_STORAGE_KEY = "adminShiftRequestsViewMode";
const VIEW_MODES = ["card", "table"];
const VIEW_MODE_LABEL = { card: "日別", table: "週間表" };

// 「時:分:秒」または「時:分」形式の文字列を10進の時間数に変換する
// （AdminConfirmedShiftCreate.jsxのtimeToHourと同じ考え方）
const timeToHour = (timeString) => {
	if (!timeString) return 0;
	const [h, m] = timeString.split(":").map(Number);
	return h + m / 60;
};

function AdminShiftRequests() {
	const [loading, setLoading] = useState(true);
	const [authError, setAuthError] = useState(false);
	const [periodId, setPeriodId] = useState(null);
	const [dates, setDates] = useState([]);
	const [shiftsByDate, setShiftsByDate] = useState({}); // shiftsByDate[date] = [shift, ...]
	const [userContractMap, setUserContractMap] = useState({});
	const [position, setPosition] = useState(() => {
		const stored = localStorage.getItem(POSITION_STORAGE_KEY);
		return POSITIONS.includes(stored) ? stored : null;
	});
	const [viewMode, setViewMode] = useState(() => {
		const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
		return VIEW_MODES.includes(stored) ? stored : "card";
	});
	const [currentWeek, setCurrentWeek] = useState(0); // 0=前半(1〜7日目), 1=後半(8〜14日目)

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
						.catch((error) => {
							const status = error.response?.status;
							return {
								date,
								shifts: [],
								authError: status === 401 || status === 403,
							};
						}),
				),
			);

			// 全日付が同じ呼び出し元で認証されるため、401/403は日付ごとの偶発的な
			// エラーではなく「セッションが無効」を意味する。1件でもあれば
			// ページ全体を再ログイン案内に切り替える（「希望者なし」との混同を防ぐ）。
			if (results.some((r) => r.authError)) {
				setAuthError(true);
				return;
			}

			const newShiftsByDate = {};
			results.forEach(({ date, shifts }) => {
				newShiftsByDate[date] = shifts;
			});
			setShiftsByDate(newShiftsByDate);

			// 週間表の契約時間・日数との過不足表示に使う
			// （週間表を開かない場合も無駄になるだけなので、他のAPIと並行取得でよい）
			try {
				const usersRes = await api.get("/api/users");
				const contractMap = {};
				usersRes.data.forEach((u) => {
					contractMap[u.id] = {
						contractDays: u.contractDays,
						contractHours: u.contractHours,
					};
				});
				setUserContractMap(contractMap);
			} catch (error) {
				console.error("ユーザー情報の取得に失敗しました", error);
			}
		} catch (error) {
			console.error("データの取得に失敗しました", error);
		} finally {
			setLoading(false);
		}
	};

	const selectPosition = (value) => {
		setPosition(value);
		localStorage.setItem(POSITION_STORAGE_KEY, value);
	};

	const selectViewMode = (value) => {
		setViewMode(value);
		localStorage.setItem(VIEW_MODE_STORAGE_KEY, value);
	};

	// 週間表：週(前半/後半)の対象7日分について、担当中のポジションの
	// スタッフごとに合計時間・出勤日数を集計し、契約時間・日数との差分を出す。
	// AdminConfirmedShiftCreate.jsxのweeklyStatsByUserと同じ考え方だが、
	// あちらは確定シフト編集用の内部データ(staff.blocks)を集計対象にしているのに対し、
	// こちらは希望シフトAPIのレスポンス(1日1件のstartTime/endTime)を集計対象にしている
	const weeklyStatsByUser = (() => {
		const weekDates = dates.slice(currentWeek * 7, currentWeek * 7 + 7);
		const map = {};
		weekDates.forEach((date) => {
			(shiftsByDate[date] || [])
				.filter((shift) => shift.position === position)
				.forEach((shift) => {
					const hours = timeToHour(shift.endTime) - timeToHour(shift.startTime);
					if (hours <= 0) return;
					if (!map[shift.userId]) {
						map[shift.userId] = {
							userId: shift.userId,
							name: shift.displayName,
							totalHours: 0,
							workedDays: 0,
						};
					}
					map[shift.userId].totalHours += hours;
					map[shift.userId].workedDays += 1;
				});
		});

		return Object.values(map)
			.map((entry) => {
				const contract = userContractMap[entry.userId];
				return {
					...entry,
					hoursDiff:
						contract?.contractHours != null
							? entry.totalHours - contract.contractHours
							: null,
					daysDiff:
						contract?.contractDays != null
							? entry.workedDays - contract.contractDays
							: null,
				};
			})
			.sort((a, b) => a.name.localeCompare(b.name, "ja"));
	})();

	useEffect(() => {
		fetchAll();
	}, []);

	// 担当未選択（初回アクセス）は、データ取得を待たずに選択画面を出す
	if (!position) {
		return (
			<Layout>
				<div className="position-picker">
					<p className="position-picker-title">どちらの担当ですか？</p>
					<div className="position-picker-buttons">
						{POSITIONS.map((p) => (
							<button
								key={p}
								type="button"
								className="position-picker-btn"
								onClick={() => selectPosition(p)}
							>
								{POSITION_LABEL[p]}
							</button>
						))}
					</div>
				</div>
			</Layout>
		);
	}

	if (loading) {
		return (
			<Layout>
				<p className="loading-text">読み込み中...</p>
			</Layout>
		);
	}

	if (authError) {
		return (
			<Layout>
				<div className="empty-state">
					<p className="empty-icon">🔒</p>
					<p className="empty-text">
						再ログインが必要です。ログイン情報の有効期限が切れているか、確認できませんでした。
					</p>
					<Link to="/" className="submit-button requests-cta">
						ホームに戻る
					</Link>
				</div>
			</Layout>
		);
	}

	return (
		<Layout>
			<div className="view-toggle">
				{POSITIONS.map((p) => (
					<button
						key={p}
						type="button"
						className={`view-toggle-btn ${position === p ? "active" : ""}`}
						onClick={() => selectPosition(p)}
					>
						{POSITION_LABEL[p]}
					</button>
				))}
			</div>

			<div className="view-toggle">
				{VIEW_MODES.map((mode) => (
					<button
						key={mode}
						type="button"
						className={`view-toggle-btn ${viewMode === mode ? "active" : ""}`}
						onClick={() => selectViewMode(mode)}
					>
						{VIEW_MODE_LABEL[mode]}
					</button>
				))}
			</div>

			{viewMode === "table" && (
				<>
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

					{(() => {
						const weekDates = dates.slice(
							currentWeek * 7,
							currentWeek * 7 + 7,
						);

						return (
							<div className="requests-table-wrap">
								<table className="requests-table">
									<thead>
										<tr>
											<th className="requests-table-name-col">氏名</th>
											{weekDates.map((date) => {
												const { label, isSun, isSat } =
													formatDisplayDate(date);
												return (
													<th
														key={date}
														className={
															isSun ? "sun" : isSat ? "sat" : ""
														}
													>
														{label}
													</th>
												);
											})}
											<th>契約差分</th>
										</tr>
									</thead>
									<tbody>
										{weeklyStatsByUser.length === 0 ? (
											<tr>
												<td
													colSpan={weekDates.length + 2}
													className="requests-table-empty"
												>
													希望者なし
												</td>
											</tr>
										) : (
											weeklyStatsByUser.map((u) => (
												<tr key={u.userId}>
													<td className="requests-table-name-col">
														{u.name}
													</td>
													{weekDates.map((date) => {
														const shift = (
															shiftsByDate[date] || []
														).find(
															(s) =>
																s.position === position &&
																s.userId === u.userId,
														);
														return (
															<td key={date}>
																{shift
																	? `${formatTime(shift.startTime)}〜${formatTime(shift.endTime)}`
																	: "－"}
															</td>
														);
													})}
													<td className="requests-table-diff-col">
														{u.hoursDiff != null && (
															<span
																className={
																	u.hoursDiff >= 0
																		? "hours-table-diff-over"
																		: "hours-table-diff-under"
																}
															>
																{u.hoursDiff >= 0 ? "+" : ""}
																{u.hoursDiff.toFixed(1)}h
															</span>
														)}
														{u.daysDiff != null && (
															<span
																className={
																	u.daysDiff >= 0
																		? "hours-table-diff-over"
																		: "hours-table-diff-under"
																}
															>
																{" "}
																{u.daysDiff >= 0 ? "+" : ""}
																{u.daysDiff}日
															</span>
														)}
													</td>
												</tr>
											))
										)}
									</tbody>
									<tfoot>
										<tr>
											<td className="requests-table-name-col">合計</td>
											{weekDates.map((date) => {
												const count = (
													shiftsByDate[date] || []
												).filter(
													(s) => s.position === position,
												).length;
												return <td key={date}>{count}人</td>;
											})}
											<td />
										</tr>
									</tfoot>
								</table>
							</div>
						);
					})()}
				</>
			)}

			{viewMode === "card" &&
				dates.map((date) => {
					const { label, isSun, isSat } = formatDisplayDate(date);
					const dayShifts = (shiftsByDate[date] || [])
						.filter((shift) => shift.position === position)
						.sort((a, b) => a.displayName.localeCompare(b.displayName, "ja"));

					return (
						<div key={date} className="day-card">
							<div className="day-card-header">
								<span
									className={`day-card-date ${isSun ? "sun" : isSat ? "sat" : ""}`}
								>
									{label}
								</span>
								<span className="day-card-count">{dayShifts.length}人</span>
							</div>
							<div className="day-card-section">
								<div className="day-card-section-title">
									{POSITION_LABEL[position]}
								</div>
								{dayShifts.length > 0 ? (
									dayShifts.map((shift) => (
										<div key={shift.userId} className="day-card-staff-row">
											<span className="day-card-staff-name">
												{shift.displayName}
											</span>
											<span className="day-card-staff-time">
												{formatTime(shift.startTime)}〜
												{formatTime(shift.endTime)}
											</span>
										</div>
									))
								) : (
									<p className="day-card-empty">希望者なし</p>
								)}
							</div>
						</div>
					);
				})}

			{periodId && (
				<Link
					to="/admin/confirmed-shifts/create"
					className="submit-button requests-cta"
				>
					この期間の確定シフトを作成する
				</Link>
			)}
		</Layout>
	);
}

export default AdminShiftRequests;
