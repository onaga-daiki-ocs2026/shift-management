import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/api";

function MySubmissions() {
	const [shifts, setShifts] = useState([]);
	const [openBlockIndex, setOpenBlockIndex] = useState(0);

	useEffect(() => {
		const loginUser = JSON.parse(localStorage.getItem("loginUser"));
		const userId = loginUser?.id;

		api
			.get(`/api/shift-requests/user/${userId}`)
			.then((response) => {
				console.log(response.data);
				setShifts(response.data);
			})
			.catch((error) => {
				console.log(error);
			});
	}, []);

	// 14日ごとにブロック分割する関数
	const groupByBlock = (shifts) => {
		const sorted = [...shifts].sort((a, b) =>
			a.workDate.localeCompare(b.workDate)
		);

		const blocks = [];
		for (let i = 0; i < sorted.length; i += 14) {
			const dates = sorted.slice(i, i + 14);
			const start = formatDisplayDate(dates[0].workDate);
			const end = formatDisplayDate(dates[dates.length - 1].workDate);
			blocks.push({
				title: `${start}〜${end}`,
				dates,
			});
		}
		return blocks;
	};

	const formatDisplayDate = (dateString) => {
		const date = new Date(dateString);
		return `${date.getMonth() + 1}/${date.getDate()}`;
	};

	const blocks = groupByBlock(shifts);

	return (
		<Layout title="提出済み確認">
			{blocks.length > 0 ? (
				<div>
					{blocks.map((block, blockIndex) => {
						const isOpen = openBlockIndex === blockIndex;

						return (
							<div key={blockIndex} className="shift-block">
								<button
									type="button"
									className="accordion-button"
									onClick={() =>
										setOpenBlockIndex(isOpen ? null : blockIndex)
									}
								>
									{isOpen ? "▼" : "▶"} {block.title}
								</button>

								{isOpen && (
									<div className="accordion-content">
										{block.dates.map((shift) => (
											<div key={shift.workDate} className="shift-row">
												<div className="shift-date">
													{formatDisplayDate(shift.workDate)}
												</div>

												<p>{shift.available ? "○ 出勤可能" : "× 出勤不可"}</p>

												{shift.available && (
													<p>
														{shift.startTime}〜{shift.endTime}
													</p>
												)}
											</div>
										))}
									</div>
								)}
							</div>
						);
					})}
				</div>
			) : (
				<p>提出済みシフトはありません</p>
			)}
		</Layout>
	);
}

export default MySubmissions;