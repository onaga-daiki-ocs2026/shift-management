import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/api";
import {
	DndContext,
	closestCenter,
	PointerSensor,
	TouchSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function AdminUserManagement() {
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [editingId, setEditingId] = useState(null);
	const [editingName, setEditingName] = useState("");
	const [savingId, setSavingId] = useState(null);
	const [orderChanged, setOrderChanged] = useState(false);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(TouchSensor, {
			activationConstraint: {
				delay: 200,
				tolerance: 5,
			},
		}),
	);

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
		setSavingId(userId);
		try {
			await api.put(`/api/users/${userId}`, {
				displayName: user.displayName,
				position: user.position,
				role: user.role,
				sortOrder: user.sortOrder,
				contractDays:
					user.contractDays === "" || user.contractDays == null
						? null
						: Number(user.contractDays),
				contractHours:
					user.contractHours === "" || user.contractHours == null
						? null
						: Number(user.contractHours),
			});
			alert(`${user.displayName}さんの設定を保存しました`);
			setEditingId(null);
		} catch (error) {
			console.error("保存に失敗しました", error);
			alert("保存に失敗しました");
		} finally {
			setSavingId(null);
		}
	};

	const handleDragEnd = (event, position) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		setUsers((prev) => {
			const sectionUsers = prev.filter((u) => u.position === position);
			const otherUsers = prev.filter((u) => u.position !== position);

			const oldIndex = sectionUsers.findIndex((u) => u.id === active.id);
			const newIndex = sectionUsers.findIndex((u) => u.id === over.id);
			const reordered = arrayMove(sectionUsers, oldIndex, newIndex);

			// positionに関係なく元の順番を保ちつつ置き換え
			const result = [...prev];
			let sectionIdx = 0;
			for (let i = 0; i < result.length; i++) {
				if (result[i].position === position) {
					result[i] = reordered[sectionIdx++];
				}
			}
			return result;
		});
		setOrderChanged(true);
	};

	const handleSaveOrder = async () => {
		try {
			const userIds = users.map((u) => u.id);
			await api.put("/api/users/sort-order", userIds);
			alert("並び順を保存しました！");
			setOrderChanged(false);
		} catch (error) {
			console.error("並び順の保存に失敗しました", error);
			alert("並び順の保存に失敗しました");
		}
	};

	if (loading) {
		return (
			<Layout>
				<p className="loading-text">読み込み中...</p>
			</Layout>
		);
	}

	return (
		<Layout>
			<div className="user-mgmt-header">
				<p className="user-mgmt-note">
					☰ 左端をドラッグして並び順を変更できます
				</p>
				{orderChanged && (
					<button
						type="button"
						className="order-save-button"
						onClick={handleSaveOrder}
					>
						並び順を保存
					</button>
				)}
			</div>

			{["HALL", "KITCHEN"].map((position) => {
				const sectionUsers = users.filter((u) => u.position === position);
				const label = position === "HALL" ? "ホール" : "キッチン";
				if (sectionUsers.length === 0) return null;

				return (
					<div key={position} className="user-section">
						<div className="user-section-title">{label}</div>
						<DndContext
							sensors={sensors}
							collisionDetection={closestCenter}
							onDragEnd={(event) => handleDragEnd(event, position)}
						>
							<SortableContext
								items={sectionUsers.map((u) => u.id)}
								strategy={verticalListSortingStrategy}
							>
								{sectionUsers.map((user) => (
									<SortableUserRow
										key={user.id}
										user={user}
										editingId={editingId}
										editingName={editingName}
										savingId={savingId}
										setEditingId={setEditingId}
										setEditingName={setEditingName}
										handleChange={handleChange}
										handleSave={handleSave}
									/>
								))}
							</SortableContext>
						</DndContext>
					</div>
				);
			})}
		</Layout>
	);
}

function SortableUserRow({
	user,
	editingId,
	editingName,
	savingId,
	setEditingId,
	setEditingName,
	handleChange,
	handleSave,
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: user.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	const isEditing = editingId === user.id;

	return (
		<div ref={setNodeRef} style={style} className="user-card">
			<div className="user-card-drag" {...attributes} {...listeners}>
				☰
			</div>

			<div className="user-card-body">
				<div className="user-card-name-row">
					{isEditing ? (
						<input
							type="text"
							className="user-name-input"
							value={editingName}
							onChange={(e) => {
								setEditingName(e.target.value);
								handleChange(user.id, "displayName", e.target.value);
							}}
							autoFocus
						/>
					) : (
						<span className="user-name">{user.displayName}</span>
					)}
					<button
						type="button"
						className="user-name-edit-btn"
						onClick={() => {
							if (isEditing) {
								setEditingId(null);
							} else {
								setEditingId(user.id);
								setEditingName(user.displayName);
							}
						}}
					>
						{isEditing ? "✕" : "✏️"}
					</button>
				</div>

				<div className="user-card-selects">
					<select
						className="user-select"
						value={user.position}
						onChange={(e) => handleChange(user.id, "position", e.target.value)}
					>
						<option value="HALL">HALL</option>
						<option value="KITCHEN">KITCHEN</option>
					</select>

					<select
						className="user-select"
						value={user.role}
						onChange={(e) => handleChange(user.id, "role", e.target.value)}
					>
						<option value="STAFF">STAFF</option>
						<option value="ADMIN">ADMIN</option>
					</select>
				</div>

				<div className="user-card-contract">
					<div className="user-card-contract-field">
						<label>契約日数（週）</label>
						<input
							type="number"
							min="0"
							max="7"
							className="user-contract-input"
							placeholder="例：5"
							value={user.contractDays ?? ""}
							onChange={(e) =>
								handleChange(user.id, "contractDays", e.target.value)
							}
						/>
						<span className="user-contract-unit">日</span>
					</div>
					<div className="user-card-contract-field">
						<label>契約時間（週）</label>
						<input
							type="number"
							min="0"
							step="0.5"
							className="user-contract-input"
							placeholder="例：30"
							value={user.contractHours ?? ""}
							onChange={(e) =>
								handleChange(user.id, "contractHours", e.target.value)
							}
						/>
						<span className="user-contract-unit">h</span>
					</div>
				</div>
			</div>

			<button
				type="button"
				className="user-save-btn"
				onClick={() => handleSave(user.id)}
				disabled={savingId === user.id}
			>
				{savingId === user.id ? "..." : "保存"}
			</button>
		</div>
	);
}

export default AdminUserManagement;
