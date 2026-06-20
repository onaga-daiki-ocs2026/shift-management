import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/api";

function AdminUserManagement() {
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchUsers();
	}, []);

	const fetchUsers = async () => {
		try {
			const response = await api.get("/api/users");
			setUsers(response.data);
		} catch (error) {
			console.error("ユーザー一覧の取得に失敗しました", error);
		} finally {
			setLoading(false);
		}
	};

	const handleChange = (userId, field, value) => {
		setUsers((prev) =>
			prev.map((user) =>
				user.id === userId ? { ...user, [field]: value } : user,
			),
		);
	};

	const handleSave = async (userId) => {
		const user = users.find((u) => u.id === userId);

		try {
			await api.put(`/api/users/${userId}`, {
				position: user.position,
				role: user.role,
			});
			alert(`${user.displayName}さんの設定を保存しました`);
		} catch (error) {
			console.error("保存に失敗しました", error);
			alert("保存に失敗しました");
		}
	};

	if (loading) {
		return (
			<Layout title="ユーザー管理">
				<p>読み込み中...</p>
			</Layout>
		);
	}

	return (
		<Layout title="ユーザー管理">
			{users.map((user) => (
				<div key={user.id} className="user-row">
					<span className="user-name">{user.displayName}</span>

					<select
						value={user.position}
						onChange={(e) => handleChange(user.id, "position", e.target.value)}
					>
						<option value="HALL">ホール</option>
						<option value="KITCHEN">キッチン</option>
					</select>

					<select
						value={user.role}
						onChange={(e) => handleChange(user.id, "role", e.target.value)}
					>
						<option value="STAFF">STAFF</option>
						<option value="ADMIN">ADMIN</option>
					</select>

					<button type="button" onClick={() => handleSave(user.id)}>
						保存
					</button>
				</div>
			))}
		</Layout>
	);
}

export default AdminUserManagement;