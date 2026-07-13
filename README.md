# やよい軒 JR森ノ宮店 シフト管理システム

## 概要

飲食店向けのLINE連携シフト管理Webアプリ。
紙やLINEメッセージで行っていたアルバイトのシフト提出・管理をWeb化。
スタッフはLINEからログインして希望シフトを提出し、管理者はガントチャート形式で確定シフトを作成する。

## デモ

> GitHub: https://github.com/onaga-daiki-ocs2026/shift-management

---

## 機能一覧

### スタッフ向け
- LINEログイン（LIFF経由・ID/パスワード不要）
- シフト希望提出（10週間分・2週間ブロック選択式・コメント機能付き）
- 提出済みシフト確認（ユーザー別・アコーディオン表示）
- 確定シフト確認（管理者が公開したPDFを閲覧）

### 管理者向け
- 希望シフト一覧（スタッフごとに2週間分を確認）
- 確定シフト作成（ガントチャート形式・PC版ドラッグ操作・スマホ版タップ操作）
- 確定シフトPDF出力・公開（Cloudinary経由でスタッフに共有）
- ユーザー管理（職種・権限・表示名の変更・ドラッグで表示順番を設定）

---

## 使用技術

### フロントエンド
- React 19 / Vite / JavaScript（JSX）
- React Router v6
- Axios
- LINE LIFF SDK
- @dnd-kit（ドラッグ&ドロップ）
- html2canvas / jsPDF
- **ホスティング：Vercel**

### バックエンド
- Java 21 / Spring Boot 3.5
- Spring Web / Spring Data JPA / Hibernate
- Lombok / Maven
- Cloudinary SDK
- Docker
- **ホスティング：Render**

### データベース
- PostgreSQL 17（Neon）

### 外部サービス
- LINE Messaging API / LINE LIFF
- Cloudinary

---

## システム構成

```
LINE公式アカウント
↓
リッチメニュー
↓
LIFF
↓
React Webアプリ（Vercel）
↓
Spring Boot API（Render）
↓
PostgreSQL（Neon）
```

---

## 画面構成

| 画面 | 対象 |
|---|---|
| ホーム | 全員 |
| シフト提出 | スタッフ |
| 提出済み確認 | スタッフ |
| 確定シフト確認 | スタッフ |
| 希望シフト一覧 | 管理者 |
| 確定シフト作成 | 管理者 |
| ユーザー管理 | 管理者 |

---

## ER図

```
users
├── id
├── lineUserId
├── displayName
├── role（STAFF / ADMIN）
├── position（HALL / KITCHEN）
├── sortOrder
└── createdAt

shift_requests
├── id
├── userId → users.id
├── periodId
├── workDate
├── startTime
├── endTime
├── available
├── comment
└── createdAt

confirmed_shifts
├── id
├── userId → users.id
├── periodId
├── workDate
├── startTime
└── endTime

shift_pdfs
├── id
├── periodStart
├── pdfUrl
├── cloudinaryPublicId
└── createdAt

submisson_priod
├── id
├── startDate
├── endDate
└── deadline
```

---

## 環境変数

### バックエンド（.env）

```
DB_URL=
DB_USERNAME=
DB_PASSWORD=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### フロントエンド（.env）

```
VITE_API_BASE_URL=
```

---

## ローカル環境構築

### 必要なツール
- Java 21
- Node.js 18以上
- Git

### 手順

```bash
# リポジトリをクローン
git clone https://github.com/onaga-daiki-ocs2026/shift-management.git
cd shift-management

# フロントエンドの依存関係をインストール
cd frontend
npm install

# フロントエンドを起動
npm run dev

# バックエンドを起動
# VSCodeでShiftManagementApplication.javaを右クリック → Run Java
```

---

## 工夫した点

- **PC・スマホ両対応のガントチャート**：画面幅768px未満でスマホ用UI（タップ→操作パネル）に自動切り替え
- **ローリング方式の提出期間**：基準日から自動計算し、DBを使わず常に正しい提出期間を表示
- **二重提出防止**：`findByUserIdAndWorkDate()`で既存レコードを検索し、UPDATEに切り替え
- **環境変数管理**：DBパスワード・Cloudinary認証情報をすべて環境変数で管理

---

## 開発者

小永大輝