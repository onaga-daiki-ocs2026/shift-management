import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/api";

function ShiftSubmit() {
	const [period, setPeriod] = useState(null);
	const [shiftBlocks, setShiftBlocks] = useState([]);
	const [openBlockIndex, setOpenBlockIndex] = useState(0);
	const [loading, setLoading] = useState(true);
	const [selectedBlocks, setSelectedBlocks] = useState([0]);

	useEffect(() => {
		fetchCurrentPeriod();
	}, []);

	const fetchCurrentPeriod = async () => {
		try {
			const response = await api.get("/api/submission-periods/current");
			const currentPeriod = response.data;

			setPeriod(currentPeriod);

			const blocks = createShiftBlocks(currentPeriod.startDate, 5);
			setShiftBlocks(blocks);
		} catch (error) {
			console.error("提出期間の取得に失敗しました", error);
		} finally {
			setLoading(false);
		}
	};

	const createShiftBlocks = (startDate, blockCount) => {
		const blocks = [];
		const baseDate = new Date(startDate);

		for (let blockIndex = 0; blockIndex < blockCount; blockIndex++) {
			const dates = [];

			for (let dayIndex = 0; dayIndex < 14; dayIndex++) {
				const date = new Date(baseDate);
				date.setDate(baseDate.getDate() + blockIndex * 14 + dayIndex);

				dates.push({
					workDate: formatDate(date),
					available: false,
					startTime: "",
					endTime: "",
				});
			}

			blocks.push({
				title: blockIndex === 0 ? "提出必須期間" : `追加提出期間${blockIndex}`,
				dates,
			});
		}

		return blocks;
	};

	const formatDate = (date) => {
		return date.toISOString().split("T")[0];
	};

	const formatDisplayDate = (dateString) => {
		const date = new Date(dateString);
		return `${date.getMonth() + 1}/${date.getDate()}`;
	};

	const handleChange = (blockIndex, dateIndex, field, value) => {
		const newBlocks = [...shiftBlocks];

		newBlocks[blockIndex].dates[dateIndex] = {
			...newBlocks[blockIndex].dates[dateIndex],
			[field]: value,
		};

		if (field === "available" && value === false) {
			newBlocks[blockIndex].dates[dateIndex].startTime = "";
			newBlocks[blockIndex].dates[dateIndex].endTime = "";
		}

		setShiftBlocks(newBlocks);
	};

	const handleSubmit = async () => {
		const loginUser = JSON.parse(localStorage.getItem("loginUser"));

		if (!loginUser) {
			alert("ログイン情報がありません。もう一度LINEログインしてください。");
			return;
		}

		// 追加：選択ブロックが必須期間のみ（実質ゼロ件）でないかチェック
		if (selectedBlocks.length === 0) {
			alert("提出する期間を1つ以上選択してください。");
			return;
		}

		const requests = shiftBlocks
			.filter((_, index) => selectedBlocks.includes(index))
			.flatMap((block) => block.dates);

		// 追加：出勤可能なのに時間未入力の項目をチェック
		const invalidShift = requests.find(
			(shift) => shift.available && (!shift.startTime || !shift.endTime)
		);

		if (invalidShift) {
			alert(
				`${formatDisplayDate(invalidShift.workDate)}の出勤時間が入力されていません。`
			);
			return;
		}

		try {
			await api.post("/api/shift-requests", {
				userId: loginUser.id,
				periodId: period.id,
				requests,
			});

			alert("シフトを提出しました！");
		} catch (error) {
			console.error("シフト提出に失敗しました", error);
			alert("シフト提出に失敗しました");
		}
	};

	if (loading) {
		return (
			<Layout>
				<p>読み込み中...</p>
			</Layout>
		);
	}

	if (!period) {
		return (
			<Layout>
				<p>提出期間が設定されていません。</p>
			</Layout>
		);
	}

	return (
		<Layout>
			<h2>シフト提出</h2>

			{shiftBlocks.map((block, blockIndex) => {
				const start = block.dates[0].workDate;
				const end = block.dates[block.dates.length - 1].workDate;
				const isOpen = openBlockIndex === blockIndex;

				return (
					<div key={blockIndex} className="shift-block">
						<div className="block-header">
							<input
								type="checkbox"
								checked={selectedBlocks.includes(blockIndex)}
								disabled={blockIndex === 0}
								onChange={(e) => {
									if (e.target.checked) {
										setSelectedBlocks([...selectedBlocks, blockIndex]);
									} else {
										setSelectedBlocks(selectedBlocks.filter((i) => i !== blockIndex));
									}
								}}
							/>
							<button
								type="button"
								className="accordion-button"
								onClick={() => setOpenBlockIndex(isOpen ? null : blockIndex)}
							>
								{isOpen ? "▼" : "▶"} {block.title}（{formatDisplayDate(start)}〜
								{formatDisplayDate(end)}）
								{blockIndex === 0 && <span className="required-badge"> 必須</span>}
							</button>
						</div>

						{isOpen && (
							<div className="accordion-content">
								{block.dates.map((shift, dateIndex) => (
									<div key={shift.workDate} className="shift-row">
										<div className="shift-date">
											{formatDisplayDate(shift.workDate)}
										</div>

										<label>
											<input
												type="checkbox"
												checked={shift.available}
												onChange={(e) =>
													handleChange(
														blockIndex,
														dateIndex,
														"available",
														e.target.checked,
													)
												}
											/>
											出勤可能
										</label>

										{shift.available && (
											<>
												<input
													type="time"
													value={shift.startTime}
													onChange={(e) =>
														handleChange(
															blockIndex,
															dateIndex,
															"startTime",
															e.target.value,
														)
													}
												/>

												<span>〜</span>

												<input
													type="time"
													value={shift.endTime}
													onChange={(e) =>
														handleChange(
															blockIndex,
															dateIndex,
															"endTime",
															e.target.value,
														)
													}
												/>
											</>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				);
			})}

			<button type="button" onClick={handleSubmit}>
				提出する
			</button>
		</Layout>
	);
}

export default ShiftSubmit;
