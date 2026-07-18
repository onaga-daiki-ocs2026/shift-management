import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/api";

const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

function formatDisplayDate(dateString) {
	if (!dateString) return "";
	const date = new Date(dateString);
	return `${date.getMonth() + 1}月${date.getDate()}日（${DAY_NAMES[date.getDay()]}）`;
}

function ConfirmedShifts() {
	const [pdfList, setPdfList] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		api
			.get("/api/pdfs/all")
			.then((response) => {
				setPdfList(response.data || []);
			})
			.catch((error) => {
				console.log(error);
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	if (loading) {
		return (
			<Layout>
				<p className="loading-text">読み込み中...</p>
			</Layout>
		);
	}

	return (
		<Layout>
			{pdfList.length > 0 ? (
				<div className="pdf-viewer-area">
					<p className="pdf-note">公開されている確定シフト（直近5件）</p>
					{pdfList.map((pdf) => (
						<a
							key={pdf.periodStart}
							href={pdf.url}
							target="_blank"
							rel="noopener noreferrer"
							className="pdf-download-button"
						>
							<span className="pdf-download-button-main">
								📄 確定シフトを開く
							</span>
							<span className="pdf-download-button-period">
								{formatDisplayDate(pdf.periodStart)}〜
								{formatDisplayDate(pdf.periodEnd)}
							</span>
						</a>
					))}

					<div className="pdf-inquiry-note">
						これより前のシフトを確認したい場合は、店舗の管理者にお問い合わせください。
					</div>
				</div>
			) : (
				<div className="empty-state">
					<p className="empty-icon">✅</p>
					<p className="empty-text">確定シフトはまだ公開されていません</p>
				</div>
			)}
		</Layout>
	);
}

export default ConfirmedShifts;
