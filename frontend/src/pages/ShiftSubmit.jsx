import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/api";

const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];
const TIME_OPTIONS = [];
for (let h = 9; h <= 23; h++) {
	const hh = String(h).padStart(2, "0");
	TIME_OPTIONS.push(`${hh}:00`);
}

function ShiftSubmit() {
	const [period, setPeriod] = useState(null);
	const [shiftBlocks, setShiftBlocks] = useState([]);
	const [openBlockIndexes, setOpenBlockIndexes] = useState(new Set([0]));
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
				comment: "",
			});
		}
		return blocks;
	};

	const handleCommentChange = (blockIndex, value) => {
		const newBlocks = [...shiftBlocks];
		newBlocks[blockIndex].comment = value;
		setShiftBlocks(newBlocks);
	};

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

	const formatDate = (date) => date.toISOString().split("T")[0];

	const formatDisplayDate = (dateString) => {
		const date = new Date(dateString);
		const day = DAY_NAMES[date.getDay()];
		const isWeekend = date.getDay() === 0 || date.getDay() === 6;
		return {
			label: `${date.getMonth() + 1}/${date.getDate()}（${day}）`,
			isWeekend,
			isSun: date.getDay() === 0,
		};
	};

	const formatBlockRange = (block) => {
		const start = new Date(block.dates[0].workDate);
		const end = new Date(block.dates[block.dates.length - 1].workDate);
		return `${start.getMonth() + 1}月${start.getDate()}日（${DAY_NAMES[start.getDay()]}）〜${end.getMonth() + 1}月${end.getDate()}日（${DAY_NAMES[end.getDay()]}）`;
	};

	const formatDeadline = (deadlineString) => {
		if (!deadlineString) return null;
		const d = new Date(deadlineString);
		return `提出期限：${d.getMonth() + 1}月${d.getDate()}日（${DAY_NAMES[d.getDay()]}）`;
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
		if (selectedBlocks.length === 0) {
			alert("提出する期間を1つ以上選択してください。");
			return;
		}

		const requests = shiftBlocks
			.filter((_, index) => selectedBlocks.includes(index))
			.flatMap((block) =>
				block.dates.map((date) => ({
					...date,
					comment: block.comment,
				})),
			);

		const invalidShift = requests.find(
			(shift) => shift.available && (!shift.startTime || !shift.endTime),
		);
		if (invalidShift) {
			const { label } = formatDisplayDate(invalidShift.workDate);
			alert(`${label}の出勤時間が入力されていません。`);
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

	if (loading)
		return (
			<Layout>
				<p className="loading-text">読み込み中...</p>
			</Layout>
		);
	if (!period)
		return (
			<Layout>
				<p className="loading-text">提出期間が設定されていません。</p>
			</Layout>
		);

	return (
		<Layout>
			<div className="submit-info-box">
				<span className="submit-info-icon">ℹ️</span>
				<div>
					<div className="submit-info-title">シフトを提出してください</div>
					<div className="submit-info-sub">
						2週間ごとにシフトを提出できます。出勤可能な日にチェックを入れてください。
					</div>
				</div>
			</div>

			{shiftBlocks.map((block, blockIndex) => {
				const isOpen = openBlockIndexes.has(blockIndex);
				const isMandatory = blockIndex === 0;

				return (
					<div
						key={blockIndex}
						className={`shift-block ${isMandatory ? "mandatory" : ""}`}
					>
						<div className="block-header">
							<div className="block-header-left">
								<span className="block-calendar-icon">📅</span>
								<span className="block-range">{formatBlockRange(block)}</span>
							</div>
							<div className="block-header-right">
								{isMandatory && period.deadline && (
									<span className="deadline-badge">
										{formatDeadline(period.deadline)}
									</span>
								)}
								{!isMandatory && (
									<input
										type="checkbox"
										className="block-checkbox"
										checked={selectedBlocks.includes(blockIndex)}
										onChange={(e) => {
											if (e.target.checked) {
												setSelectedBlocks([...selectedBlocks, blockIndex]);
											} else {
												setSelectedBlocks(
													selectedBlocks.filter((i) => i !== blockIndex),
												);
											}
										}}
									/>
								)}
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
									<span className="shift-col-label">開始時間</span>
									<span className="shift-col-label">終了時間</span>
									<span className="shift-col-label">休み</span>
								</div>

								{block.dates.map((shift, dateIndex) => {
									const { label, isSun, isWeekend } = formatDisplayDate(
										shift.workDate,
									);
									return (
										<div key={shift.workDate} className="shift-row">
											<div
												className={`shift-date ${isSun ? "sun" : isWeekend ? "sat" : ""}`}
											>
												{label}
											</div>

											<select
												className="time-select"
												value={shift.startTime}
												disabled={!shift.available}
												onChange={(e) =>
													handleChange(
														blockIndex,
														dateIndex,
														"startTime",
														e.target.value,
													)
												}
											>
												<option value="">－</option>
												{TIME_OPTIONS.map((t) => (
													<option key={t} value={t}>
														{t}
													</option>
												))}
											</select>

											<select
												className="time-select"
												value={shift.endTime}
												disabled={!shift.available}
												onChange={(e) =>
													handleChange(
														blockIndex,
														dateIndex,
														"endTime",
														e.target.value,
													)
												}
											>
												<option value="">－</option>
												{TIME_OPTIONS.map((t) => (
													<option key={t} value={t}>
														{t}
													</option>
												))}
											</select>

											<div className="shift-rest">
												<input
													type="checkbox"
													className="rest-checkbox"
													checked={!shift.available}
													onChange={(e) =>
														handleChange(
															blockIndex,
															dateIndex,
															"available",
															!e.target.checked,
														)
													}
												/>
												<span className="rest-label">休み</span>
											</div>
										</div>
									);
								})}

								<div className="comment-area">
									<label className="comment-label">
										📝 この期間のコメント
										<span className="comment-optional">（任意）</span>
									</label>
									<textarea
										className="comment-textarea"
										placeholder="例：試験期間のため出勤日数が少なくなります"
										value={block.comment}
										onChange={(e) =>
											handleCommentChange(blockIndex, e.target.value)
										}
										rows={3}
									/>
								</div>
							</div>
						)}
					</div>
				);
			})}

			{/* 全ブロック共通の提出ボタン（一番下に1つ） */}
			<button
				type="button"
				className="block-submit-button"
				onClick={handleSubmit}
			>
				<span>✈</span> チェックした期間のシフトを提出する
			</button>
			<p className="submit-note">
				※未入力や休みの選択漏れがある場合は、提出できません。
			</p>
		</Layout>
	);
}

export default ShiftSubmit;