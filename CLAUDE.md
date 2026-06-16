# CLAUDE.md — SOUND·TRADE プロジェクト指示書

このファイルは **Claude Code 専用の指示書** です。プロジェクトルートに配置し、Claude Code が自動的に読み込んで実装方針を理解します。

---

## プロジェクト概要

**SOUND·TRADE** は合同会社369（ミロク）が運営する B2B 楽器卸売 EC プラットフォーム。
楽器店バイヤー・スタジオ仕入担当・音楽教室運営者が、商品を検索→見積依頼を出すための業務用Webサービス。

- **開発者**: じぇい（合同会社369 代表）
- **想定公開**: 2026年6月（着手から1ヶ月以内）
- **初期データ**: YAMAHA 管楽器 294商品（既存Shopify CSVから投入）
- **デプロイ先**: Vercel（jackandace/369 のサブディレクトリ運用）

---

## 技術スタック

```
Frontend:    Next.js 14 (App Router) + TypeScript (strict)
Styling:     Tailwind CSS + shadcn/ui
Database:    Supabase (PostgreSQL 15+)
Auth:        Supabase Auth (管理画面のみ。公開サイトは無認証)
Storage:     Supabase Storage
CSV処理:     papaparse（クライアント/Edge Function）
Email:       Resend
Analytics:   GA4 + GTM + Search Console
```

`@/` パスエイリアスは `src/` を指す。コンポーネントは `src/components/`、ページは `src/app/`、ユーティリティは `src/lib/`。

---

## ディレクトリ構成

```
sound-trade/
├── CLAUDE.md
├── README.md
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── src/
│   ├── app/
│   │   ├── (public)/           # 公開サイト
│   │   │   ├── page.tsx        # トップ
│   │   │   ├── catalog/
│   │   │   ├── products/[handle]/
│   │   │   ├── cart/
│   │   │   └── inquiry/
│   │   ├── (admin)/            # 管理画面
│   │   │   ├── dashboard/
│   │   │   ├── products/
│   │   │   ├── inquiries/
│   │   │   ├── imports/        # CSV取込
│   │   │   ├── preview/        # 擬似プレビュー
│   │   │   ├── snapshots/      # バックアップ
│   │   │   └── audit/          # 監査ログ
│   │   ├── api/                # API Routes
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                 # shadcn/ui
│   │   ├── public/             # 公開サイト用
│   │   └── admin/              # 管理画面用
│   ├── lib/
│   │   ├── supabase/
│   │   ├── csv/                # CSV検証ロジック
│   │   ├── validators/
│   │   └── utils.ts
│   └── types/
├── supabase/
│   ├── migrations/             # SQL移行スクリプト
│   └── seed/                   # シードデータ（YAMAHA 294商品）
└── public/
    └── images/
```

---

## 開発の絶対ルール

### 1. moheim 風ミニマルモダンのデザイン原則（公開サイト）

**カラー**: オフホワイト基調（#FAFAF7）、墨色（#1A1A1A）、ベージュ補色（#F4F0E8）、罫線極細グレー（#E5E5E5）。アクセントは木の温もり（#B8956A）を控えめに。

**フォント**: 日本語は `Noto Sans JP`（Light / Regular / Medium）、英字は `DM Sans`。明朝NG。

**余白**: たっぷり。セクション縦余白 120px（PC）、商品カード間 40px。コンテナ最大幅 1280px。

**コンポーネント**: 角丸 2px（極小）、シャドウほぼなし、ボタンはアウトライン基本、画像は白背景・大判。

**動き**: `transition 300ms ease`、ホバーは透過度ダウンか下線フェードイン。派手な動きは禁止。

### 2. ユニバーサルデザイン原則（管理画面）

**フォント**: `Noto Sans JP` 一貫使用、明朝禁止。

**文字サイズ可変**: ヘッダー右上に「A- / A / A+」3段階切替UI。CSS変数 `--font-base` を 14/16/18px で切り替え、`localStorage` に保存。

**カラー（CUD準拠）**: 必ず「色 + アイコン + テキスト」の三重表現。
- 危険/エラー: `#D52941` + ⚠
- 警告: `#F4A300` + ⚠
- 成功: `#2E7D32` + ✓
- 情報: `#1976D2` + ℹ
- 中立: `#6C757D` + ○

**操作性**: ボタン最小 44px×44px、隣接ボタン間 8px以上、リンク下線必須、コントラスト比 4.5:1 以上。

### 3. データの安全性ルール（最重要）

**CSV取込は絶対に即時反映しない**。必ず以下のフローを通す：

```
アップロード → スキーマ検証 → ステージング書込 → データ検証
→ 差分プレビュー → エラー修正UI → 擬似プレビュー → 承認
→ スナップショット作成 → 本番反映 → 通知 + 監査ログ
```

実装すべきテーブル: `products_staging`, `variants_staging`, `product_specs_staging`, `import_jobs`, `import_errors`, `product_snapshots`, `audit_logs`, `system_settings`

詳細仕様は `docs/import_flow_spec.md` 参照。

**反映前は必ず `product_snapshots` テーブルに JSONB でバックアップを保存**。ロールバックの根幹。

**価格処理**: 
- shopify CSVは税込価格そのまま入る前提
- `products.msrp` は税抜換算（÷1.10）
- 価格0または特別生産品マーク（*/★）は自動で `status='draft'`

**価格表示ポリシー（2026-05 改定）**:
- 当初の「価格完全クローズ」から方針変更。**定価（メーカー希望小売価格・税込）のみ参考表示**する。
- 表示には `products.msrp_incl_tax`（税込）を使用。表示ヘルパーは `src/lib/price.ts`。
- 実際の**卸価格は引き続き非公開**。見積依頼で個別案内するハイブリッド方式。
- 価格0/null の商品は定価を出さず「お見積もり対応」のみ（従来どおり）。

### 4. 権限ロール

`admin_users.role` を以下の4種類で運用。
- `super_admin` — じぇいさん。全権・ロールバック・ユーザー管理。
- `admin` — 社内メンバー。インポート承認・反映可能。
- `editor` — クライアント担当。商品編集・インポート反映可能。
- `client` — クライアント本人。アップロード〜承認待ちまで（反映は不可）。

すべてのテーブルに **RLS（Row Level Security）** ポリシーを設定。詳細は `docs/db_schema_additions.sql` 参照。

### 5. コーディング規約

- TypeScript `strict: true`、`noUncheckedIndexedAccess: true`
- 命名: `camelCase`（変数）、`PascalCase`（コンポーネント）、`SCREAMING_SNAKE`（定数）、`kebab-case`（ファイル名・URL）
- Server Component と Client Component の境界を明示（`"use client"` は必要最小限）
- データフェッチは Server Component 優先、フォーム送信は Server Actions
- 環境変数は `NEXT_PUBLIC_*` を除き全て Server Side のみで使用
- エラーハンドリングは try-catch + 型安全な Result 型推奨

---

## 実装の進め方（Week 単位）

### Week 1: 基盤構築

```bash
npx create-next-app@latest sound-trade --typescript --tailwind --app --src-dir --eslint
cd sound-trade
npx shadcn@latest init
```

優先順:
1. Supabase プロジェクト作成、`supabase/migrations/` に DB スキーマ全反映
2. `.env.local` に Supabase URL / Anon Key / Service Role Key 設定
3. デザイントークンを `src/lib/design-tokens.ts` と `tailwind.config.ts` に反映
4. YAMAHA 294商品シードデータを `supabase/seed/yamaha.sql` から投入
5. Vercel デプロイ動作確認

### Week 2: 公開サイト

優先順:
1. 共通レイアウト（Header / Footer / Container）
2. トップページ（ヒーロー / カテゴリ / 取扱メーカー）
3. カテゴリ一覧 / 商品一覧（フィルタ機能）
4. 商品詳細（スペック表 / カート追加）
5. 見積カート / 見積依頼フォーム / Resend メール送信
6. 送信完了ページ

### Week 3: 管理画面

優先順:
1. 管理画面レイアウト + 認証ガード + 文字サイズ切替UI
2. ダッシュボード（今日の見積依頼数、月次推移）
3. 見積依頼管理 / 商品マスタ管理
4. **CSV インポート機能**（一番重い、ここで時間使う想定）
   - アップロードUI
   - スキーマ検証
   - ステージング書込
   - データ検証
   - 修正UI
5. 擬似プレビュー機能

### Week 4: 仕上げ・QA・公開

優先順:
1. 承認フロー + スナップショット保存 + 監査ログ
2. UD対応の最終調整（アクセシビリティ）
3. SEO（メタタグ、OGP、サイトマップ、robots.txt）
4. 総合QA + バグ修正
5. パフォーマンス調整（画像最適化、code splitting）
6. 本番デプロイ + ドメイン設定 + Analytics連携

---

## よくある詰まりポイントと対処

### Supabase RLS で「行が取得できない」

→ 公開サイトは無認証で読み取りするテーブル（products / variants / specs）には、`anon` ロール向けの SELECT ポリシーを必ず付ける。

```sql
CREATE POLICY public_read_products ON products
  FOR SELECT TO anon USING (status = 'active');
```

### Next.js App Router で「Server Component から useState 使えない」

→ そのコンポーネントを `"use client"` で Client Component に変える。ただしできるだけ末端だけにする。

### CSV 文字化け

→ BOM付き UTF-8（utf-8-sig）で扱う。papaparse 設定:
```ts
Papa.parse(file, { encoding: 'UTF-8', skipEmptyLines: true })
```

### スナップショットが巨大化

→ JSONB の `pg_column_size` を確認しつつ、`is_protected` フラグで保護指定。自動削除は `cleanup_old_snapshots()` 関数で日次実行。

### 文字サイズ切替が反映されない

→ CSS変数を `:root` でなく `html` 要素または `body` 要素に対して設定。`data-size` 属性で切り替え:

```css
html[data-size="lg"] { --font-base: 18px; }
body { font-size: var(--font-base); }
```

---

## テスト戦略

Phase 1 では最小限。本格テストは Phase 2。

- **必須**: CSVインポート系のユニットテスト（バリデーション関数）
- **推奨**: 見積依頼送信のE2E（Playwright）
- **省略可**: その他のテスト

---

## デプロイ・運用

- **本番ブランチ**: `main`
- **開発ブランチ**: `develop`
- **PR**: 必ず develop → main
- **Vercel**: 自動デプロイ（main = production / develop = preview）
- **ドメイン**: sound-trade.jp（仮）

### 環境変数

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

---

## じぇいさんとの確認タイミング

各週末に必ず確認:
- **Week 1 終了**: DB スキーマ動作確認、シードデータ投入確認 → 「動くか確認お願いします」
- **Week 2 終了**: 公開サイト全ページが見られる状態 → 「見え方確認お願いします」
- **Week 3 終了**: 管理画面と CSV インポート動作 → 「動かしてみてください」
- **Week 4 終了**: 本番反映、QA 完了 → 「公開して大丈夫か確認お願いします」

仕様の認識違いがあれば早期に修正。**最終週で大きな仕様変更は避ける**。

---

## 参照ドキュメント

プロジェクトルートの `docs/` 配下:
- `requirements_v2.docx` — 要件定義書 v2.0
- `design_tokens.md` — デザイントークン詳細
- `db_schema_additions.sql` — 追加DBスキーマ
- `import_flow_spec.md` — インポートフロー詳細

---

## トーン・スタイル

- 報告は **簡潔・端的** に
- 不明点があれば **先に確認** してから動く
- アウトプットには **「確認してください」の一言** を添える
- 作業単位: **1d = 4h**

---

**バージョン**: 1.0
**作成**: 2026年5月20日
