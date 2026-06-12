import Layout from "../components/Layout";

function AdminConfirmedShiftCreate() {
	const sampleShifts = [
		{
			id: 1,
			name: "田中",
			workDate: "2026-06-01",
			startTime: "17:00",
			endTime: "22:00",
		},
		{
			id: 2,
			name: "山田",
			workDate: "2026-06-01",
			startTime: "18:00",
			endTime: "23:00",
		},
		{
			id: 3,
			name: "佐藤",
			workDate: "2026-06-01",
			startTime: "10:00",
			endTime: "15:00",
		},
	];

	return (
		<Layout title="管理者：確定シフト作成">
			<p>横棒グラフ形式で確定シフトを作成する予定</p>

			<div className="shift-timeline">
				{sampleShifts.map((shift) => (
					<div className="timeline-row" key={shift.id}>
						<div className="timeline-name">{shift.name}</div>

						<div className="timeline-area">
							<div className="timeline-bar">
								{shift.startTime}〜{shift.endTime}
							</div>
						</div>
					</div>
				))}
			</div>

			<button className="submit-button">確定シフトを保存</button>
		</Layout>
	);
}

export default AdminConfirmedShiftCreate;
