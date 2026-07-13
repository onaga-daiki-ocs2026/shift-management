import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/api";

function ConfirmedShifts() {
	const [pdfUrl, setPdfUrl] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		api
			.get("/api/pdfs/current")
			.then((response) => {
				setPdfUrl(response.data.url || null);
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
			{pdfUrl ? (
				<div className="pdf-viewer-area">
					<p className="pdf-note">確定シフトのPDFが公開されています</p>
					<a
						href={pdfUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="pdf-download-button"
					>
						📄 確定シフトを開く
					</a>
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