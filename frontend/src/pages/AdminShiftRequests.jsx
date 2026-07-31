import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../api/api";

const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];
const POSITION_STORAGE_KEY = "adminShiftRequestsPosition";
const POSITIONS = ["HALL", "KITCHEN"];
const POSITION_LABEL = { HALL: "ホール", KITCHEN: "キッチン" };

function AdminShiftRequests() {
	const [loading, setLoading] = useState(true);
	const [authError, setAuthError] = useState(false);
	const [periodId, setPeriodId] = useState(null);
	const [dates, setDates] = useState([]);
	const [shiftsByDate, setShiftsByDate] = useState({}); // shiftsByDate[date] = [shift, ...]
	const [position, setPosition] = useState(() => {
		const stored = localStorage.getItem(POSITION_STORAGE_KEY);
		return POSITIONS.includes(stored) ? stored : null;
	});

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

			{dates.map((date) => {
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
