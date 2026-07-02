import { Link, useLocation } from "react-router-dom";

const PAGE_TITLES = {
	"/": "ホーム",
	"/submit": "シフト提出",
	"/my-submissions": "提出済み確認",
	"/confirmed-shifts": "確定シフト確認",
	"/admin/shift-requests": "希望シフト一覧",
	"/admin/confirmed-shifts/create": "確定シフト作成",
	"/admin/users": "ユーザー管理",
};

function Layout({ children }) {
	const location = useLocation();
	const isHome = location.pathname === "/";
	const title = PAGE_TITLES[location.pathname] ?? "シフト管理";

	return (
		<div className="app">
			<header className="app-header">
				{!isHome && (
					<div className="header-top">
						<Link to="/" className="back-button">
							＜ ホームに戻る
						</Link>
					</div>
				)}
				<div className="header-title-area">
					<h1 className="header-title">{title}</h1>
					<div className="header-underline" />
				</div>
			</header>

			<main className="app-main">{children}</main>
		</div>
	);
}

export default Layout;