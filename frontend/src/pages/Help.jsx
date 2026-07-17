import { useState } from "react";
import Layout from "../components/Layout";

const FAQ_SECTIONS = [
	{
		title: "📅 シフト提出について",
		items: [
			{
				q: "シフトはどうやって提出しますか？",
				a: "ホーム画面の「シフト提出」から入り、各日付ごとに出勤時間を選択してください。休みの日は「休み」にチェックを入れます。入力が終わったら、提出したい期間にチェックを入れて、一番下の提出ボタンを押してください。",
			},
			{
				q: "提出必須期間と追加提出期間の違いは何ですか？",
				a: "一番上の「提出必須期間」は必ず提出が必要な2週間分です（チェックは外せません）。それ以外の「追加提出期間」は、まだ先の予定が分かる場合に任意で提出できる期間です。チェックを入れた期間だけがまとめて送信されます。",
			},
			{
				q: "コメント欄には何を書けばいいですか？",
				a: "その2週間の期間全体に関するコメントを自由に書けます（任意項目です）。例えば「試験期間のため出勤日数が少なくなります」「〇日は遅れて出勤になるかもしれません」など、シフト作成の参考にしてほしい情報を書いてください。",
			},
			{
				q: "時間を入力したのに提出できません",
				a: "「休み」にチェックが入っていない日は、開始時間・終了時間の両方を入力する必要があります。どこか1日でも時間が空欄になっていると提出できませんので、赤いアラートで表示された日付を確認してください。",
			},
			{
				q: "一度提出した内容はあとから変更できますか？",
				a: "はい、同じ期間をもう一度提出すると、前の内容が上書きされます。提出期限内であれば、何度でも修正して再提出できます。",
			},
		],
	},
	{
		title: "📋 提出済み確認について",
		items: [
			{
				q: "自分が提出した内容を確認したい",
				a: "ホーム画面の「提出済み確認」から、自分が提出したシフト希望の一覧を確認できます。",
			},
		],
	},
	{
		title: "✅ 確定シフト確認について",
		items: [
			{
				q: "確定したシフトはどこで見られますか？",
				a: "ホーム画面の「確定シフト確認」から、店舗が確定・公開したシフト表（PDF）を確認できます。まだ公開されていない場合は「確定シフトはまだ公開されていません」と表示されます。",
			},
			{
				q: "確定シフトが公開されたらLINEで通知は来ますか？",
				a: "はい、店舗がシフトを確定・公開すると、LINEで通知が届きます。通知が届いたら、アプリの「確定シフト確認」から内容をチェックしてください。",
			},
			{
				q: "シフト提出の締め切りが近づくと知らせてくれますか？",
				a: "はい、提出期限の前日になっても、まだ提出必須期間のシフトを提出していない場合は、LINEでリマインド通知が届きます。",
			},
		],
	},
	{
		title: "🔧 うまく動かないときは",
		items: [
			{
				q: "画面が真っ白・エラーが出て開けない",
				a: "一度アプリを閉じて開き直すか、LINEアプリ自体を再起動してみてください。それでも直らない場合は、店舗の管理者に「画面が開けない」と伝えてください。",
			},
			{
				q: "ログインできない・名前が違う人になっている",
				a: "LINEのアカウントが正しいものになっているか確認してください。解決しない場合は、店舗の管理者に連絡してください。",
			},
		],
	},
];

function Help() {
	const [openKey, setOpenKey] = useState(null);

	const toggle = (key) => {
		setOpenKey((prev) => (prev === key ? null : key));
	};

	return (
		<Layout>
			<div className="submit-info-box">
				<span className="submit-info-icon">❓</span>
				<div>
					<div className="submit-info-title">よくある質問</div>
					<div className="submit-info-sub">
						困ったときはここを確認してください。解決しない場合は店舗の管理者にご連絡ください。
					</div>
				</div>
			</div>

			{FAQ_SECTIONS.map((section, sectionIndex) => (
				<div key={sectionIndex} className="help-section">
					<h3 className="help-section-title">{section.title}</h3>

					{section.items.map((item, itemIndex) => {
						const key = `${sectionIndex}-${itemIndex}`;
						const isOpen = openKey === key;
						return (
							<div key={key} className="help-item">
								<button
									type="button"
									className="help-question"
									onClick={() => toggle(key)}
								>
									<span>{item.q}</span>
									<span className="help-toggle-icon">
										{isOpen ? "︿" : "﹀"}
									</span>
								</button>
								{isOpen && <div className="help-answer">{item.a}</div>}
							</div>
						);
					})}
				</div>
			))}
		</Layout>
	);
}

export default Help;
