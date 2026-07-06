import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import { initLiff } from "../liff/liff";
import api from "../api/api";
import logo from "../assets/yayoi-logo.png";

const STAFF_MENUS = [
	{
		to: "/submit",
		icon: "📅",
		label: "シフト提出",
		sub: "次回のシフトを提出します",
	},
	{
		to: "/my-submissions",
		icon: "📋",
		label: "提出済み確認",
		sub: "提出したシフトを確認します",
	},
	{
		to: "/confirmed-shifts",
		icon: "✅",
		label: "確定シフト確認",
		sub: "確定したシフトを確認します",
	},
];

const ADMIN_MENUS = [
	{
		to: "/admin/shift-requests",
		icon: "👥",
		label: "希望シフト一覧",
		sub: "スタッフの希望シフトを確認します",
	},
	{
		to: "/admin/confirmed-shifts/create",
		icon: "📝",
		label: "確定シフト作成",
		sub: "確定シフトを作成・編集します",
	},
	{
		to: "/admin/users",
		icon: "⚙️",
		label: "ユーザー管理",
		sub: "スタッフの職種・権限を設定します",
	},
];

function Home() {
	const [loginUser, setLoginUser] = useState(null);

	useEffect(() => {
		const login = async () => {
			try {
				const lineUser = await initLiff();
				if (!lineUser) return;

				const response = await api.post("/api/users/login", {
					lineUserId: lineUser.lineUserId,
					displayName: lineUser.displayName,
				});

				localStorage.setItem("loginUser", JSON.stringify(response.data));
				setLoginUser(response.data);
			} catch (error) {
				console.error(error);
			}
		};
		login();
	}, []);

	const isAdmin = loginUser?.role === "ADMIN";

	const footer = (
		<footer className="app-footer">
			<div className="footer-bar" />
			<div className="footer-logo-area">
				<img src={logo} alt="やよい軒" className="footer-logo" />
			</div>
			<p className="footer-copy">© 2026 やよい軒 JR森ノ宮店 | Developed by daiki</p>
		</footer>
	);

	return (
		<Layout footer={footer}>
			<div className="home-section">
				<div className="home-section-title">
					<span className="home-section-deco">＼＼</span>
					スタッフメニュー
					<span className="home-section-deco">／／</span>
				</div>

				<div className="menu">
					{STAFF_MENUS.map((item) => (
						<Link key={item.to} to={item.to} className="menu-button">
							<span className="menu-icon">{item.icon}</span>
							<span className="menu-text">
								<span className="menu-label">{item.label}</span>
								<span className="menu-sub">{item.sub}</span>
							</span>
							<span className="menu-arrow">›</span>
						</Link>
					))}
				</div>

				{isAdmin && (
					<>
						<div className="home-section-title" style={{ marginTop: "24px" }}>
							<span className="home-section-deco">＼＼</span>
							オーナーメニュー
							<span className="home-section-deco">／／</span>
						</div>

						<div className="menu">
							{ADMIN_MENUS.map((item) => (
								<Link key={item.to} to={item.to} className="menu-button">
									<span className="menu-icon">{item.icon}</span>
									<span className="menu-text">
										<span className="menu-label">{item.label}</span>
										<span className="menu-sub">{item.sub}</span>
									</span>
									<span className="menu-arrow">›</span>
								</Link>
							))}
						</div>
					</>
				)}
			</div>
		</Layout>
	);
}

export default Home;