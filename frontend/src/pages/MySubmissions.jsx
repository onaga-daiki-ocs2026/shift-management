import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/api";

function MySubmissions() {
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
		<Layout title="提出済み確認">
			{shifts.length > 0 ? (
				<div>
					{shifts.map((shift, index) => (
						<div className="shift-card" key={index}>
							<h3>{shift.workDate}</h3>

							<p>{shift.available ? "○ 出勤可能" : "× 出勤不可"}</p>

							{shift.available && (
								<p>
									{shift.startTime}〜{shift.endTime}
								</p>
							)}
						</div>
					))}
				</div>
			) : (
				<p>提出済みシフトはありません</p>
			)}
		</Layout>
	);
}

export default MySubmissions;
