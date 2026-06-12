import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/api";

function AdminShiftRequests() {
	const [shifts, setShifts] = useState([]);

	useEffect(() => {
		api
			.get("/api/shift-requests")
			.then((response) => {
				console.log(response.data);
				setShifts(response.data);
			})
			.catch((error) => {
				console.log(error);
			});
	}, []);

	return (
		<Layout title="管理者：希望シフト一覧">
			{shifts.length > 0 ? (
				<div>
					{shifts.map((shift, index) => (
						<div className="shift-card" key={index}>
							<h3>{shift.workDate}</h3>

							<p>
								状態：
								{shift.available ? "出勤可能" : "出勤不可"}
							</p>

							{shift.available && (
								<p>
									時間：
									{shift.startTime}〜{shift.endTime}
								</p>
							)}
						</div>
					))}
				</div>
			) : (
				<p>希望シフトはまだありません</p>
			)}
		</Layout>
	);
}

export default AdminShiftRequests;
