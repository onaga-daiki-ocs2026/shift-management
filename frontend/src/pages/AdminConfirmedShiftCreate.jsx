import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/api";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const RANGE_START = 0;
const RANGE_END = 24;
const TOTAL_HOURS = RANGE_END - RANGE_START;
const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

function AdminConfirmedShiftCreate() {
	const [periodId, setPeriodId] = useState(null);
	const [periodStart, setPeriodStart] = useState(null);
	const [dates, setDates] = useState([]);
	const [dayStaffMap, setDayStaffMap] = useState({});
	const [userContractMap, setUserContractMap] = useState({});
	const [loading, setLoading] = useState(true);
	const [selected, setSelected] = useState(null);
	const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
	const [exporting, setExporting] = useState(false);
	const [saving, setSaving] = useState(false);
	const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
	const [exportStage, setExportStage] = useState("capturing"); // "capturing" | "uploading"
	const [uploadPercent, setUploadPercent] = useState(0);
	const [exportElapsed, setExportElapsed] = useState(0);
	const [currentWeek, setCurrentWeek] = useState(0); // 0=前半, 1=後半
	const [dayMemoMap, setDayMemoMap] = useState({});

	useEffect(() => {
		const handleResize = () => setIsMobile(window.innerWidth < 768);
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	useEffect(() => {
		fetchPeriodAndShifts();
	}, []);

	// PDF生成中の経過時間を100ms毎に更新
	useEffect(() => {
		if (!exporting) return;
		const start = Date.now();
		const timer = setInterval(() => {
			setExportElapsed(Date.now() - start);
		}, 100);
		return () => clearInterval(timer);
	}, [exporting]);

	const fetchPeriodAndShifts = async () => {
		try {
			const response = await api.get("/api/submission-periods/current");
			const period = response.data;
			setPeriodId(period.id);
			setPeriodStart(period.startDate);

			const startDate = new Date(period.startDate);
			const dateList = [];
			for (let i = 0; i < 14; i++) {
				const d = new Date(startDate);
				d.setDate(startDate.getDate() + i);
				dateList.push(formatDate(d));
			}
			setDates(dateList);

			const results = await Promise.all(
				dateList.map((date) =>
					api
						.get(`/api/shift-requests/date/${date}`)
						.then((res) => ({ date, shifts: res.data }))
						.catch(() => ({ date, shifts: [] })),
				),
			);

			// 既に一時保存された確定シフトがあれば、それを希望シフトより
			// 優先して復元する（リロードで編集内容が消えてしまう問題への対策）
			const confirmedMap = {};
			const confirmedRoleMap = {};
			try {
				const confirmedRes = await api.get("/api/confirmed-shifts");
				const dateSet = new Set(dateList);
				confirmedRes.data.forEach((c) => {
					if (!dateSet.has(c.workDate)) return;
					const key = `${c.userId}_${c.workDate}`;
					if (!confirmedMap[key]) confirmedMap[key] = [];
					confirmedMap[key].push({
						start: timeToHour(c.startTime),
						end: timeToHour(c.endTime),
					});
					if (c.role) confirmedRoleMap[key] = c.role;
				});
			} catch (error) {
				console.error("確定シフトの取得に失敗しました", error);
			}

			try {
				const usersRes = await api.get("/api/users");
				const contractMap = {};
				usersRes.data.forEach((u) => {
					contractMap[u.id] = {
						contractDays: u.contractDays,
						contractHours: u.contractHours,
					};
				});
				setUserContractMap(contractMap);
			} catch (error) {
				console.error("ユーザー情報の取得に失敗しました", error);
			}

			const map = {};
			results.forEach(({ date, shifts }) => {
				const toStaffList = (list) =>
					list.map((shift) => {
						const start = timeToHour(shift.startTime);
						const end = timeToHour(shift.endTime);
						const original = [{ start, end }];
						const confirmedBlocks =
							confirmedMap[`${shift.userId}_${date}`];
						const blocks = confirmedBlocks
							? JSON.parse(JSON.stringify(confirmedBlocks))
							: JSON.parse(JSON.stringify(original));
						return {
							userId: shift.userId,
							name: shift.displayName,
							comment: shift.comment || "",
							role: confirmedRoleMap[`${shift.userId}_${date}`] || "",
							original,
							blocks,
						};
					});

				map[date] = {
					hall: toStaffList(shifts.filter((s) => s.position === "HALL")),
					kitchen: toStaffList(
						shifts.filter((s) => s.position === "KITCHEN"),
					),
				};
			});

			setDayStaffMap(map);
		} catch (error) {
			console.error("提出期間の取得に失敗しました", error);
		} finally {
			setLoading(false);
		}
	};

	const formatDate = (date) => {
		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, "0");
		const d = String(date.getDate()).padStart(2, "0");
		return `${y}-${m}-${d}`;
	};

	const formatDisplayDate = (dateString) => {
		const date = new Date(dateString);
		const day = DAY_NAMES[date.getDay()];
		const isSun = date.getDay() === 0;
		const isSat = date.getDay() === 6;
		return {
			label: `${date.getMonth() + 1}月${date.getDate()}日（${day}）`,
			isSun,
			isSat,
		};
	};

	const timeToHour = (timeString) => {
		const [h, m] = timeString.split(":").map(Number);
		return h + m / 60;
	};

	const hourToTime = (hour) => {
		const h = Math.floor(hour);
		const m = Math.round((hour - h) * 60);
		return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
	};

	const hourToLabel = (hour) => {
		const h = Math.floor(hour);
		const m = Math.round((hour - h) * 60);
		return m === 0 ? `${h}:00` : `${h}:${m}`;
	};

	const getStaffList = (date, position) =>
		dayStaffMap[date]?.[position === "HALL" ? "hall" : "kitchen"] ?? [];

	const updateBlocks = (date, position, userId, newBlocks) => {
		const key = position === "HALL" ? "hall" : "kitchen";
		setDayStaffMap((prev) => ({
			...prev,
			[date]: {
				...prev[date],
				[key]: prev[date][key].map((s) =>
					s.userId === userId ? { ...s, blocks: newBlocks } : s,
				),
			},
		}));
	};

	const updateRole = (date, position, userId, role) => {
		const key = position === "HALL" ? "hall" : "kitchen";
		setDayStaffMap((prev) => ({
			...prev,
			[date]: {
				...prev[date],
				[key]: prev[date][key].map((s) =>
					s.userId === userId ? { ...s, role } : s,
				),
			},
		}));
	};

	const updateDayMemo = (date, memo) => {
		setDayMemoMap((prev) => ({ ...prev, [date]: memo }));
	};

	const resetOne = (date, position, userId) => {
		const key = position === "HALL" ? "hall" : "kitchen";
		setDayStaffMap((prev) => ({
			...prev,
			[date]: {
				...prev[date],
				[key]: prev[date][key].map((s) =>
					s.userId === userId
						? { ...s, blocks: JSON.parse(JSON.stringify(s.original)) }
						: s,
				),
			},
		}));
		setSelected(null);
	};

	const removeRow = (date, position, userId) => {
		const key = position === "HALL" ? "hall" : "kitchen";
		setDayStaffMap((prev) => ({
			...prev,
			[date]: {
				...prev[date],
				[key]: prev[date][key].filter((s) => s.userId !== userId),
			},
		}));
		setSelected(null);
	};

	const resetAll = () => {
		setDayStaffMap((prev) => {
			const next = {};
			Object.entries(prev).forEach(([date, { hall, kitchen }]) => {
				next[date] = {
					hall: hall.map((s) => ({
						...s,
						blocks: JSON.parse(JSON.stringify(s.original)),
					})),
					kitchen: kitchen.map((s) => ({
						...s,
						blocks: JSON.parse(JSON.stringify(s.original)),
					})),
				};
			});
			return next;
		});
		setSelected(null);
	};

	const splitBlock = (date, position, userId, blockIndex) => {
		const staff = getStaffList(date, position).find(
			(s) => s.userId === userId,
		);
		const b = staff.blocks[blockIndex];
		if (b.end - b.start <= 1) return;

		const mid = Math.round(((b.start + b.end) / 2) * 2) / 2;
		const newBlocks = [...staff.blocks];
		newBlocks.splice(
			blockIndex,
			1,
			{ start: b.start, end: mid - 0.5 },
			{ start: mid + 0.5, end: b.end },
		);
		updateBlocks(date, position, userId, newBlocks);
		setSelected(null);
	};

	const deleteBlock = (date, position, userId, blockIndex) => {
		const staff = getStaffList(date, position).find(
			(s) => s.userId === userId,
		);
		const newBlocks = staff.blocks.filter((_, i) => i !== blockIndex);
		updateBlocks(date, position, userId, newBlocks);
		setSelected(null);
	};

	const handleSubmit = async () => {
		const requests = [];
		dates.forEach((date) => {
			const allStaff = [
				...getStaffList(date, "HALL"),
				...getStaffList(date, "KITCHEN"),
			];
			allStaff.forEach((staff) => {
				staff.blocks.forEach((b) => {
					requests.push({
						userId: staff.userId,
						workDate: date,
						startTime: hourToTime(b.start),
						endTime: hourToTime(b.end),
						role: staff.role || "",
					});
				});
			});
		});

		if (requests.length === 0) {
			alert("確定するシフトがありません。");
			return;
		}

		setSaving(true);
		try {
			await api.post("/api/confirmed-shifts", { periodId, requests });
			alert("14日分の確定シフトを保存しました！");
		} catch (error) {
			console.error("保存に失敗しました", error);
			alert("保存に失敗しました");
		} finally {
			setSaving(false);
		}
	};

	const handleExportPdf = async () => {
		setExporting(true);
		setSelected(null);
		setExportProgress({ current: 0, total: dates.length });
		setExportStage("capturing");
		setUploadPercent(0);
		setExportElapsed(0);

		// exporting=true の再描画（非表示の週の日が一時的に見えるようになる）が
		// 画面に反映されるのを待つ
		await new Promise((resolve) =>
			requestAnimationFrame(() => requestAnimationFrame(resolve)),
		);

		const container = document.getElementById("pdf-export-area");
		container.classList.add("pdf-mode");

		try {
			const pdf = new jsPDF({
				// 中身（表）が横長ではなく縦長の形なので、A4縦向きの方が
				// ページいっぱいに収まり、右の余白が出にくい
				orientation: "portrait",
				unit: "mm",
				format: "a4",
				compress: true,
			});
			const pdfWidth = pdf.internal.pageSize.getWidth();
			const pdfHeight = pdf.internal.pageSize.getHeight();

			for (let i = 0; i < dates.length; i++) {
				const date = dates[i];
				const dayElement = document.getElementById(`day-section-${date}`);
				if (!dayElement) continue;

				// 実際のウィンドウ幅に関わらず、A4比率に合わせて調整済みの
				// 幅（965px）で必ずキャプチャする。ブラウザ幅によって余白の
				// 出方が変わってしまう問題への対策。
				const originalWidth = dayElement.style.width;
				dayElement.style.width = "965px";

				const canvas = await html2canvas(dayElement, {
					scale: 3,
					useCORS: true,
					backgroundColor: "#ffffff",
					windowWidth: 965,
					logging: false,
				});

				dayElement.style.width = originalWidth;

				// Supabase Storageは50MBまで余裕があるので、
				// 画質を上げつつJPEGで軽量化する
				const imgData = canvas.toDataURL("image/jpeg", 1.0);

				// 横幅いっぱいに広げることを優先し（左右の余白をなくす）、
				// それで縦がページからはみ出す場合だけ縦基準に切り替える
				let imgWidth = pdfWidth;
				let imgHeight = (canvas.height * pdfWidth) / canvas.width;

				if (imgHeight > pdfHeight) {
					imgHeight = pdfHeight;
					imgWidth = (canvas.width * pdfHeight) / canvas.height;
				}

				// 余白が残る場合は中央に配置する
				const offsetX = (pdfWidth - imgWidth) / 2;
				const offsetY = (pdfHeight - imgHeight) / 2;

				if (i > 0) pdf.addPage();
				pdf.addImage(imgData, "JPEG", offsetX, offsetY, imgWidth, imgHeight);

				setExportProgress({ current: i + 1, total: dates.length });

				// ブラウザに描画・progressバー更新の余裕を与える
				await new Promise((resolve) => requestAnimationFrame(resolve));
			}

			const pdfBlob = pdf.output("blob");
			const pdfSizeMB = pdfBlob.size / 1024 / 1024;

			if (pdfBlob.size > 50 * 1024 * 1024) {
				alert(
					`PDFのファイルサイズが大きすぎます（${pdfSizeMB.toFixed(1)}MB / 上限50MB）。\n` +
						`スタッフの人数や日数が多い場合に発生します。お手数ですが開発者に連絡してください。`,
				);
				return;
			}

			const formData = new FormData();
			formData.append("file", pdfBlob, "shift.pdf");
			formData.append("periodStart", periodStart);

			setExportStage("uploading");
			// 段階の切り替えが画面に反映されるのを待つ
			await new Promise((resolve) => requestAnimationFrame(resolve));

			await api.post("/api/pdfs/upload", formData, {
				headers: { "Content-Type": "multipart/form-data" },
				onUploadProgress: (progressEvent) => {
					if (!progressEvent.total) return;
					const percent = Math.round(
						(progressEvent.loaded / progressEvent.total) * 100,
					);
					setUploadPercent(percent);
				},
			});
			alert(
				`PDFを保存しました！（${dates.length}日分・${pdfSizeMB.toFixed(1)}MB・${(exportElapsed / 1000).toFixed(1)}秒）\nスタッフの確定シフト確認画面に反映されます。`,
			);
		} catch (error) {
			console.error("PDF出力に失敗しました", error);
			if (error.response?.status === 500) {
				alert(
					"PDF出力に失敗しました（サーバー側のエラー）。\nファイルサイズが大きすぎる可能性があります。",
				);
			} else {
				alert("PDF出力に失敗しました");
			}
		} finally {
			container.classList.remove("pdf-mode");
			setExporting(false);
		}
	};

	const displayDates = dates.filter((_, i) =>
		currentWeek === 0 ? i < 7 : i >= 7
	);

	const selectedStaff = selected
		? getStaffList(selected.date, selected.position).find(
				(s) => s.userId === selected.userId,
			)
		: null;

	// 期間全体（14日分）のコメントを、スタッフごとに「同じ文言は1つにまとめて」表示
	const commentsByUser = (() => {
		const map = {};
		dates.forEach((date) => {
			const hall = getStaffList(date, "HALL");
			const kitchen = getStaffList(date, "KITCHEN");
			[...hall, ...kitchen]
				.filter((s) => s.comment && s.comment.trim() !== "")
				.forEach((s) => {
					if (!map[s.userId]) {
						map[s.userId] = { userId: s.userId, name: s.name, comments: new Set() };
					}
					map[s.userId].comments.add(s.comment);
				});
		});

		return Object.values(map).map((u) => ({
			userId: u.userId,
			name: u.name,
			entries: Array.from(u.comments).map((comment) => ({
				key: `${u.userId}-${comment}`,
				comment,
			})),
		}));
	})();

	// 前半（1〜7日目）・後半（8〜14日目）それぞれで実働時間・出勤日数を集計し、
	// 週あたりの契約時間・契約日数と比較する
	const weeklyStatsByUser = (() => {
		const halves = [dates.slice(0, 7), dates.slice(7, 14)];

		const buildHalf = (halfDates) => {
			const map = {};
			halfDates.forEach((date) => {
				const hall = getStaffList(date, "HALL");
				const kitchen = getStaffList(date, "KITCHEN");
				[...hall, ...kitchen].forEach((s) => {
					const hours = s.blocks.reduce(
						(sum, b) => sum + (b.end - b.start),
						0,
					);
					if (hours <= 0) return;
					if (!map[s.userId]) {
						map[s.userId] = {
							userId: s.userId,
							name: s.name,
							totalHours: 0,
							workedDays: 0,
						};
					}
					map[s.userId].totalHours += hours;
					map[s.userId].workedDays += 1;
				});
			});
			return map;
		};

		const [firstMap, secondMap] = halves.map(buildHalf);
		const userIds = new Set([
			...Object.keys(firstMap),
			...Object.keys(secondMap),
		]);

		return Array.from(userIds)
			.map((userIdStr) => {
				const userId = Number(userIdStr);
				const first = firstMap[userId];
				const second = secondMap[userId];
				const name = first?.name ?? second?.name;
				const contract = userContractMap[userId];

				const buildEntry = (half) => ({
					hours: half?.totalHours ?? 0,
					hoursDiff:
						contract?.contractHours != null
							? (half?.totalHours ?? 0) - contract.contractHours
							: null,
					days: half?.workedDays ?? 0,
					daysDiff:
						contract?.contractDays != null
							? (half?.workedDays ?? 0) - contract.contractDays
							: null,
				});

				return {
					userId,
					name,
					contractHours: contract?.contractHours ?? null,
					contractDays: contract?.contractDays ?? null,
					first: buildEntry(first),
					second: buildEntry(second),
				};
			})
			.sort((a, b) => a.name.localeCompare(b.name, "ja"));
	})();

	if (loading) {
		return (
			<Layout>
				<p className="loading-text">読み込み中...</p>
			</Layout>
		);
	}

	return (
		<>
		<Layout>
			<div className="confirmed-create-toolbar">
				<div className="confirmed-create-left-actions">
					<button
						type="button"
						onClick={() =>
							window.scrollTo({ top: 0, behavior: "smooth" })
						}
						className="scroll-top-button"
					>
						↑ 一番上に戻る
					</button>
					<button
						type="button"
						onClick={resetAll}
						className="reset-all-button"
					>
						全員リセット
					</button>
				</div>
				<div className="confirmed-create-actions">
					<button
						type="button"
						onClick={handleSubmit}
						className="submit-button"
						disabled={saving}
					>
						{saving ? (
							<>
								<span className="submit-spinner" />
								保存中…
							</>
						) : (
							"一時保存"
						)}
					</button>
					<button
						type="button"
						className="pdf-export-button"
						onClick={handleExportPdf}
						disabled={exporting}
					>
						{exporting ? "PDF生成中..." : "📄 PDFを生成・公開"}
					</button>
				</div>
			</div>

			<div className="confirmed-create-body">
				{!isMobile && weeklyStatsByUser.length > 0 && (
					<aside className="comments-sidebar hours-sidebar">
						<div className="comments-sidebar-title">⏱ 契約との過不足</div>
						{(() => {
							const half =
								currentWeek === 0
									? { key: "first", label: "前半（1〜7日目）" }
									: { key: "second", label: "後半（8〜14日目）" };
							return (
								<div className="hours-half-block">
									<div className="hours-half-title">{half.label}</div>
									<table className="hours-table">
										<thead>
											<tr>
												<th>氏名</th>
												<th>時間</th>
												<th>日数</th>
											</tr>
										</thead>
										<tbody>
											{weeklyStatsByUser.map((u) => {
												const entry = u[half.key];
												const diffClass = (d) =>
													d == null
														? ""
														: d > 0
															? "hours-table-diff-over"
															: d < 0
																? "hours-table-diff-under"
																: "";
												return (
													<tr key={u.userId}>
														<td>{u.name}</td>
														<td>
															{entry.hours.toFixed(1)}時間
															{entry.hoursDiff != null && (
																<span
																	className={`hours-table-diff ${diffClass(entry.hoursDiff)}`}
																>
																	（{entry.hoursDiff >= 0 ? "+" : ""}
																	{entry.hoursDiff.toFixed(1)}）
																</span>
															)}
														</td>
														<td>
															{entry.days}日
															{entry.daysDiff != null && (
																<span
																	className={`hours-table-diff ${diffClass(entry.daysDiff)}`}
																>
																	（{entry.daysDiff >= 0 ? "+" : ""}
																	{entry.daysDiff}）
																</span>
															)}
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							);
						})()}
					</aside>
				)}
				<div className="confirmed-create-main">
					<div className="week-tabs">
						<button
							type="button"
							className={`week-tab ${currentWeek === 0 ? "active" : ""}`}
							onClick={() => setCurrentWeek(0)}
						>
							前半（1〜7日目）
						</button>
						<button
							type="button"
							className={`week-tab ${currentWeek === 1 ? "active" : ""}`}
							onClick={() => setCurrentWeek(1)}
						>
							後半（8〜14日目）
						</button>
					</div>

					<div id="pdf-export-area">
						{dates.map((date, index) => {
							const { label, isSun, isSat } = formatDisplayDate(date);
							const hallList = getStaffList(date, "HALL");
							const kitchenList = getStaffList(date, "KITCHEN");

							// 前半(0〜6)/後半(7〜13)のうち、今表示していない週の日は
							// DOM上には残す（PDF生成で個別に撮影するため）が、
							// 画面には出さないようにする
							const isInCurrentWeek =
								currentWeek === 0 ? index < 7 : index >= 7;

							return (
								<div
									key={date}
									id={`day-section-${date}`}
									className={`day-section ${isInCurrentWeek ? "" : "hidden-week"}`}
								>
									<div
										className={`day-section-title ${isSun ? "sun" : isSat ? "sat" : ""}`}
									>
										{label}
									</div>

									<ShiftSection
										title="ホール"
										position="HALL"
										date={date}
										staffList={hallList}
										isMobile={isMobile}
										selected={selected}
										setSelected={setSelected}
										updateBlocks={updateBlocks}
										updateRole={updateRole}
										resetOne={resetOne}
										removeRow={removeRow}
										splitBlock={splitBlock}
										deleteBlock={deleteBlock}
										hourToLabel={hourToLabel}
									/>
									<ShiftSection
										title="キッチン"
										position="KITCHEN"
										date={date}
										staffList={kitchenList}
										isMobile={isMobile}
										selected={selected}
										setSelected={setSelected}
										updateBlocks={updateBlocks}
										updateRole={updateRole}
										resetOne={resetOne}
										removeRow={removeRow}
										splitBlock={splitBlock}
										deleteBlock={deleteBlock}
										hourToLabel={hourToLabel}
									/>

									<div className="day-memo-area">
										<span className="day-memo-label">伝達事項</span>
										<textarea
											className="day-memo-textarea"
											placeholder="この日の伝達事項を入力（例：10時オープン）"
											value={dayMemoMap[date] || ""}
											onChange={(e) => updateDayMemo(date, e.target.value)}
										/>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				{!isMobile && commentsByUser.length > 0 && (
					<aside className="comments-sidebar">
						<div className="comments-sidebar-title">💬 コメント一覧（14日分）</div>
						{commentsByUser.map((u) => (
							<div key={u.userId} className="comments-sidebar-user-group">
								<div className="comments-sidebar-user-name">{u.name}</div>
								{u.entries.map((e) => (
									<div key={e.key} className="comments-sidebar-item">
										<div className="comments-sidebar-text">{e.comment}</div>
									</div>
								))}
							</div>
						))}
					</aside>
				)}
			</div>
		</Layout>


		{selected && selectedStaff && (
			<EditModal
				date={selected.date}
				position={selected.position}
				staff={selectedStaff}
				blockIndex={selected.blockIndex}
				updateBlocks={updateBlocks}
				splitBlock={splitBlock}
				deleteBlock={deleteBlock}
				setSelected={setSelected}
			/>
		)}

		{exporting && (
			<div className="pdf-progress-overlay">
				<div className="pdf-progress-box">
					<div className="pdf-progress-title">
						{exportStage === "uploading"
							? "☁️ アップロードしています…"
							: "📄 PDFを生成しています…"}
					</div>
					<div className="pdf-progress-bar-track">
						<div
							className="pdf-progress-bar-fill"
							style={{
								width: `${
									exportStage === "uploading"
										? 85 + uploadPercent * 0.15
										: exportProgress.total > 0
											? (exportProgress.current / exportProgress.total) * 85
											: 0
								}%`,
							}}
						/>
					</div>
					<div className="pdf-progress-text">
						{exportStage === "uploading"
							? `アップロード中 ${uploadPercent}%`
							: `${exportProgress.current} / ${exportProgress.total} 日分`}
					</div>
				</div>
			</div>
		)}
		</>
	);
}

const FIXED_ROWS_PER_SECTION = 15;

function ShiftSection({
	title,
	position,
	date,
	staffList,
	isMobile,
	selected,
	setSelected,
	updateBlocks,
	updateRole,
	resetOne,
	removeRow,
	splitBlock,
	deleteBlock,
	hourToLabel,
}) {
	const totalHours = staffList.reduce((sum, staff) => {
		const staffTotal = staff.blocks.reduce(
			(s, b) => s + (b.end - b.start),
			0,
		);
		return sum + staffTotal;
	}, 0);

	const emptyRowCount = Math.max(0, FIXED_ROWS_PER_SECTION - staffList.length);

	return (
		<div
			className={`shift-section ${position === "KITCHEN" ? "kitchen" : ""}`}
		>
			<h3>{title}</h3>

			<div className="timeline-header">
				<div className="timeline-role-spacer">役割</div>
				<div className="timeline-name-spacer">氏名</div>
				<div className="timeline-hours">
					{Array.from(
						{ length: TOTAL_HOURS },
						(_, i) => RANGE_START + i,
					).map((h) => (
						<span
							key={h}
							style={{ left: `${((h - RANGE_START) / TOTAL_HOURS) * 100}%` }}
						>
							{h}
						</span>
					))}
				</div>
				<div className="timeline-hours-time">計画</div>
				<div className="timeline-icon-spacer" />
			</div>

			{staffList.map((staff) => (
				<StaffRow
					key={staff.userId}
					date={date}
					position={position}
					staff={staff}
					isMobile={isMobile}
					selected={selected}
					setSelected={setSelected}
					updateBlocks={updateBlocks}
					updateRole={updateRole}
					resetOne={resetOne}
					removeRow={removeRow}
					splitBlock={splitBlock}
					deleteBlock={deleteBlock}
					hourToLabel={hourToLabel}
				/>
			))}

			{Array.from({ length: emptyRowCount }, (_, i) => (
				<EmptyRow key={`empty-${i}`} />
			))}

			<div className="section-total">
				合計：<span>{totalHours.toFixed(1)}h</span>
			</div>
		</div>
	);
}

function EmptyRow() {
	return (
		<div className="timeline-row empty-row">
			<div className="timeline-role" />
			<div className="timeline-name" />
			<div className="timeline-track" />
			<div className="timeline-hours-time" />
			<div className="row-icon-actions" />
		</div>
	);
}

function StaffRow({
	date,
	position,
	staff,
	isMobile,
	selected,
	setSelected,
	updateBlocks,
	updateRole,
	resetOne,
	removeRow,
	splitBlock,
	deleteBlock,
	hourToLabel,
}) {
	const hourToPct = (h) => ((h - RANGE_START) / TOTAL_HOURS) * 100;

	const clientXToHour = (clientX, trackEl) => {
		const rect = trackEl.getBoundingClientRect();
		const ratio = (clientX - rect.left) / rect.width;
		let hour = RANGE_START + ratio * TOTAL_HOURS;
		hour = Math.round(hour * 2) / 2;
		return Math.max(RANGE_START, Math.min(RANGE_END, hour));
	};

	const handleBarClick = (blockIndex) => {
		setSelected({ date, position, userId: staff.userId, blockIndex });
	};

	const handleDoubleClick = (blockIndex) => {
		if (!isMobile) {
			splitBlock(date, position, staff.userId, blockIndex);
		}
	};

	const handleDragStart = (mode, blockIndex, e, trackEl) => {
		if (isMobile) return;
		e.preventDefault();
		e.stopPropagation();

		const block = staff.blocks[blockIndex];
		let dragOffset = 0;

		if (mode === "move") {
			const clientX = e.touches ? e.touches[0].clientX : e.clientX;
			dragOffset = clientXToHour(clientX, trackEl) - block.start;
		}

		const move = (moveEvent) => {
			const clientX = moveEvent.touches
				? moveEvent.touches[0].clientX
				: moveEvent.clientX;
			const hour = clientXToHour(clientX, trackEl);
			const newBlocks = [...staff.blocks];
			const b = { ...newBlocks[blockIndex] };

			if (mode === "move") {
				const duration = b.end - b.start;
				let newStart = hour - dragOffset;
				const prevEnd =
					blockIndex > 0 ? newBlocks[blockIndex - 1].end : RANGE_START;
				const nextStart =
					blockIndex < newBlocks.length - 1
						? newBlocks[blockIndex + 1].start
						: RANGE_END;
				newStart = Math.max(
					prevEnd,
					Math.min(nextStart - duration, newStart),
				);
				b.start = newStart;
				b.end = newStart + duration;
			} else if (mode === "left") {
				const prevEnd =
					blockIndex > 0 ? newBlocks[blockIndex - 1].end : RANGE_START;
				b.start = Math.max(prevEnd, Math.min(hour, b.end - 0.5));
			} else if (mode === "right") {
				const nextStart =
					blockIndex < newBlocks.length - 1
						? newBlocks[blockIndex + 1].start
						: RANGE_END;
				b.end = Math.min(nextStart, Math.max(hour, b.start + 0.5));
			}

			newBlocks[blockIndex] = b;
			updateBlocks(date, position, staff.userId, newBlocks);
		};

		const stop = () => {
			window.removeEventListener("mousemove", move);
			window.removeEventListener("mouseup", stop);
			window.removeEventListener("touchmove", move);
			window.removeEventListener("touchend", stop);
		};

		window.addEventListener("mousemove", move);
		window.addEventListener("mouseup", stop);
		window.addEventListener("touchmove", move, { passive: false });
		window.addEventListener("touchend", stop);
	};

	const isBarSelected = (blockIndex) =>
		selected &&
		selected.date === date &&
		selected.position === position &&
		selected.userId === staff.userId &&
		selected.blockIndex === blockIndex;

	return (
		<div className="timeline-row">
			<div className="timeline-role">
				<select
					className="role-input"
					value={staff.role || ""}
					onChange={(e) =>
						updateRole(date, position, staff.userId, e.target.value)
					}
				>
					<option value=""></option>
					<option value="指導">指導</option>
					<option value="仕込">仕込</option>
					<option value="研修">研修</option>
				</select>
			</div>
			<div className="timeline-name">
				<span>{staff.name}</span>
			</div>

			<div className="timeline-track">
				{staff.blocks.map((b, blockIndex) => {
					return (
						<div
							key={blockIndex}
							className={`timeline-bar ${isBarSelected(blockIndex) ? "selected" : ""}`}
							style={{
								left: `${hourToPct(b.start)}%`,
								width: `${hourToPct(b.end) - hourToPct(b.start)}%`,
							}}
							onClick={() => handleBarClick(blockIndex)}
							onDoubleClick={() => handleDoubleClick(blockIndex)}
							onMouseDown={(e) =>
								handleDragStart(
									"move",
									blockIndex,
									e,
									e.currentTarget.parentElement,
								)
							}
							onTouchStart={(e) =>
								handleDragStart(
									"move",
									blockIndex,
									e,
									e.currentTarget.parentElement,
								)
							}
						>
							<span className="bar-label">
								{hourToLabel(b.start)}〜{hourToLabel(b.end)}
							</span>

							{!isMobile && (
								<>
									<div
										className="resize-handle left"
										onMouseDown={(e) =>
											handleDragStart(
												"left",
												blockIndex,
												e,
												e.currentTarget.parentElement.parentElement,
											)
										}
									/>
									<div
										className="resize-handle right"
										onMouseDown={(e) =>
											handleDragStart(
												"right",
												blockIndex,
												e,
												e.currentTarget.parentElement.parentElement,
											)
										}
									/>
									<button
										type="button"
										className="bar-delete"
										onClick={(e) => {
											e.stopPropagation();
											deleteBlock(
												date,
												position,
												staff.userId,
												blockIndex,
											);
										}}
									>
										×
									</button>
								</>
							)}
						</div>
					);
				})}
			</div>

			<div className="timeline-hours-time">
				{staff.blocks
					.reduce((sum, b) => sum + (b.end - b.start), 0)
					.toFixed(1)}
				h
			</div>

			<div className="row-icon-actions">
				{staff.comment && (
					<span
						className="comment-icon"
						title={`コメント：${staff.comment}`}
					>
						💬
					</span>
				)}
				<button
					type="button"
					title="戻す"
					onClick={() => resetOne(date, position, staff.userId)}
				>
					↺
				</button>
				<button
					type="button"
					className="danger"
					title="削除"
					onClick={() => removeRow(date, position, staff.userId)}
				>
					✕
				</button>
			</div>
		</div>
	);
}

function EditModal({
	date,
	position,
	staff,
	blockIndex,
	updateBlocks,
	splitBlock,
	deleteBlock,
	setSelected,
}) {
	const block = staff.blocks[blockIndex];

	const hourOptions = [];
	for (let h = RANGE_START; h <= RANGE_END; h += 0.5) {
		hourOptions.push(h);
	}

	const hourToLabel = (hour) => {
		const h = Math.floor(hour);
		const m = Math.round((hour - h) * 60);
		return m === 0 ? `${h}:00` : `${h}:${m}`;
	};

	const handleStartChange = (value) => {
		const newBlocks = [...staff.blocks];
		newBlocks[blockIndex] = {
			...newBlocks[blockIndex],
			start: parseFloat(value),
		};
		updateBlocks(date, position, staff.userId, newBlocks);
	};

	const handleEndChange = (value) => {
		const newBlocks = [...staff.blocks];
		newBlocks[blockIndex] = {
			...newBlocks[blockIndex],
			end: parseFloat(value),
		};
		updateBlocks(date, position, staff.userId, newBlocks);
	};

	return (
		<div className="edit-modal-overlay" onClick={() => setSelected(null)}>
			<div className="edit-modal" onClick={(e) => e.stopPropagation()}>
				<div className="edit-modal-header">
					<span>
						{staff.name}
						<span className="edit-modal-position">
							（{position === "HALL" ? "ホール" : "キッチン"}）
						</span>
					</span>
					<button
						type="button"
						className="edit-modal-close-x"
						onClick={() => setSelected(null)}
					>
						×
					</button>
				</div>

				<div className="edit-modal-body">
					<div className="edit-modal-time">
						<div className="edit-modal-time-group">
							<label>開始時刻</label>
							<select
								value={block.start}
								onChange={(e) => handleStartChange(e.target.value)}
							>
								{hourOptions.map((h) => (
									<option key={h} value={h}>
										{hourToLabel(h)}
									</option>
								))}
							</select>
						</div>
						<span className="edit-modal-tilde">〜</span>
						<div className="edit-modal-time-group">
							<label>終了時刻</label>
							<select
								value={block.end}
								onChange={(e) => handleEndChange(e.target.value)}
							>
								{hourOptions.map((h) => (
									<option key={h} value={h}>
										{hourToLabel(h)}
									</option>
								))}
							</select>
						</div>
					</div>
				</div>

				<div className="edit-modal-actions">
					<button
						type="button"
						className="edit-modal-btn edit-modal-btn-split"
						onClick={() =>
							splitBlock(date, position, staff.userId, blockIndex)
						}
					>
						分割
					</button>
					<button
						type="button"
						className="edit-modal-btn edit-modal-btn-delete"
						onClick={() =>
							deleteBlock(date, position, staff.userId, blockIndex)
						}
					>
						削除
					</button>
					<button
						type="button"
						className="edit-modal-btn edit-modal-btn-save"
						onClick={() => setSelected(null)}
					>
						保存
					</button>
				</div>
			</div>
		</div>
	);
}

export default AdminConfirmedShiftCreate;
