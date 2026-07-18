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
	const [pdfUrl, setPdfUrl] = useState(null);
	const [periodStart, setPeriodStart] = useState(null);
	const [periodEnd, setPeriodEnd] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		api
			.get("/api/pdfs/current")
			.then((response) => {
				setPdfUrl(response.data.url || null);
				setPeriodStart(response.data.periodStart || null);
				setPeriodEnd(response.data.periodEnd || null);
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

	const periodLabel =
		periodStart && periodEnd
			? `${formatDisplayDate(periodStart)}〜${formatDisplayDate(periodEnd)}`
			: null;

	return (
		<Layout>
			{pdfUrl ? (
				<div className="pdf-viewer-area">
					<p className="pdf-note">確定シフトのPDFが公開されています</p>
					<a
						href={pdfUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="pdf-download-button"
					>
						<span className="pdf-download-button-main">
							📄 確定シフトを開く
						</span>
						{periodLabel && (
							<span className="pdf-download-button-period">
								{periodLabel}
							</span>
						)}
					</a>
				</div>
			) : (
				<div className="empty-state">
					<p className="empty-icon">✅</p>
					<p className="empty-text">確定シフトはまだ公開されていません</p>
					{periodLabel && (
						<p className="empty-sub-text">
							対象期間：{periodLabel}
						</p>
					)}
				</div>
			)}
		</Layout>
	);
}

export default ConfirmedShifts;
