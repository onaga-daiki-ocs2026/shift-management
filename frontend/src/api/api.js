import axios from "axios";

const api = axios.create({
	baseURL: "https://shift-management-api-evju.onrender.com",
});

// サーバー側の管理者チェック用に、ログイン中ユーザーのLINE IDを毎リクエストに付与する。
api.interceptors.request.use((config) => {
	try {
		const loginUser = JSON.parse(localStorage.getItem("loginUser"));
		if (loginUser?.lineUserId) {
			config.headers["X-Line-User-Id"] = loginUser.lineUserId;
		}
	} catch {
		// localStorageが壊れている場合はヘッダーなしで送る（サーバー側で403になる）
	}
	return config;
});

export default api;
