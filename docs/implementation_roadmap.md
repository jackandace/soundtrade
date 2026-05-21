# SOUND·TRADE 実装ロードマップ

じぇいさんが Claude Code と一緒に進める **30日間の作業手順書**。
各日の具体的なタスクと「Claude Code への投げ方の例」を記載。

---

## 事前準備（着手前にやること）

### A. アカウント・サービス準備

- [ ] **Supabase** アカウント作成、プロジェクト新規作成
- [ ] **Resend** アカウント作成（メール送信用、無料枠OK）
- [ ] **Vercel** アカウント既存利用（jackandace の 369 リポジトリ）
- [ ] **ドメイン**取得（推奨: `sound-trade.jp` / `soundtrade.jp` / クライアント希望ドメイン）

### B. Claude Code セットアップ

- [ ] ローカルに `sound-trade` 用ディレクトリを作成
- [ ] そのディレクトリで Claude Code を起動
- [ ] `CLAUDE.md` をプロジェクトルートに配置（このパッケージ内のものをコピー）

### C. 既存資産の準備

- [ ] YAMAHA 294商品の CSV を `/mnt/user-data/outputs/wind_brochures/` から取り出す
- [ ] `requirements_v2.docx` を確認
- [ ] `db_schema_additions.sql` を確認

---

## Week 1: 基盤構築（Day 1〜7）

### Day 1（月）: プロジェクト初期化

**やること**:
1. `sound-trade` ディレクトリ作成、Next.js 14 セットアップ
2. Tailwind CSS / shadcn/ui 初期設定
3. ディレクトリ構成を CLAUDE.md 通りに整える

**Claude Code への投げ方例**:
```
CLAUDE.md を読んで、Next.js 14 + TypeScript + Tailwind + shadcn/ui
の初期セットアップをしてください。ディレクトリ構成は CLAUDE.md の
「ディレクトリ構成」セクション通りにしてください。
package.json と tsconfig.json も整えてください。
```

**確認ポイント**:
- `npm run dev` で http://localhost:3000 が立ち上がる
- TypeScript strict が効いている
- shadcn/ui の `Button` などが import できる

### Day 2（火）: Supabase 接続

**やること**:
1. Supabase クライアント設定（`src/lib/supabase/`）
2. 環境変数 `.env.local` に Supabase URL / Anon Key / Service Role Key
3. 動作確認（test query）

**Claude Code への投げ方例**:
```
Supabase 接続用のクライアントを src/lib/supabase/ に作ってください。
client.ts（ブラウザ用）と server.ts（Server Component用）の2つ。
.env.local のテンプレートも作成してください。
動作確認用に簡単な test query を書いてください。
```

### Day 3-4（水・木）: DB スキーマ構築

**やること**:
1. `supabase/migrations/` に SQL マイグレーション分割
2. 既存想定テーブル（products / variants / specs / categories / makers / inquiries / customers / admin_users）作成
3. 追加テーブル（products_staging / import_jobs / snapshots / audit_logs etc.）作成
4. RLS ポリシー設定

**Claude Code への投げ方例**:
```
docs/db_schema_additions.sql を読んで、Supabase のマイグレーション
ファイルに分割してください。ファイル命名は YYYYMMDDHHMMSS_description.sql。

最初のマイグレーション:
1. base_tables.sql ... products, variants, product_specs, categories,
   makers, inquiries, inquiry_items, customers, admin_users
2. staging_tables.sql ... products_staging 系
3. import_tables.sql ... import_jobs, import_errors
4. snapshot_audit.sql ... product_snapshots, audit_logs, system_settings
5. rls_policies.sql ... 全RLSポリシー
6. functions.sql ... rollback_to_snapshot, cleanup_old_snapshots

Supabase ダッシュボードから順番に実行できるようにしてください。
```

**確認ポイント**:
- Supabase ダッシュボードで全テーブルが見える
- RLS が有効になっている
- 関数（function）が登録されている

### Day 5（金）: YAMAHA 294商品シードデータ投入

**やること**:
1. `/mnt/user-data/outputs/wind_brochures/products_*.csv` を Supabase に投入
2. variants / specs も含めて投入
3. データが正しく取得できるか確認

**Claude Code への投げ方例**:
```
YAMAHA管楽器の8カタログ（clarinet, saxophone, trumpet, trombone,
horn, recorder, doublereed, flute）のCSVデータを Supabase に投入する
シードスクリプトを作成してください。

データソース: ./csv-data/ 配下の products_*.csv / variants_*.csv /
product_specs_*.csv

要件:
- 既存データは upsert で上書き
- handle が key
- 価格0の商品は status='draft' で投入
- カテゴリ・メーカーは自動で正規化（無ければ新規作成）

実行コマンドは npm run seed で。
```

### Day 6-7（土・日）: Vercel デプロイ確認

**やること**:
1. GitHub `jackandace/369` リポジトリにサブディレクトリ `sound-trade/` として push
2. Vercel で別プロジェクトとしてデプロイ（Root Directory: `sound-trade`）
3. ドメイン仮設定（Vercel preview URL でOK）
4. 環境変数を Vercel に登録

**確認ポイント**:
- Vercel preview URL でアクセスできる
- Supabase 接続が動く（test query 実行）

---

## Week 2: 公開サイト（Day 8〜14）

### Day 8-9（月・火）: デザインシステム

**やること**:
1. `tailwind.config.ts` にデザイントークン反映（色・フォント・余白）
2. Google Fonts で Noto Sans JP / DM Sans を読み込み
3. 共通コンポーネント作成（Container / Header / Footer）
4. レイアウト雛形

**Claude Code への投げ方例**:
```
docs/design_tokens.md の「公開サイト」セクションを読んで、
tailwind.config.ts と globals.css にデザイントークンを反映してください。

src/components/public/ に以下を作成:
- Container.tsx (max-w-7xl mx-auto px-4 lg:px-8)
- Header.tsx (ミニマルなヘッダー、ロゴ + ナビ + カート数)
- Footer.tsx (会社情報 + リンク)
- Layout.tsx (Header + main + Footer)

moheim.com 風のミニマルさを意識。シャドウほぼなし、余白たっぷり。
```

### Day 10-11（水・木）: 商品一覧・詳細

**やること**:
1. トップページ（ヒーロー / カテゴリ / 取扱メーカー）
2. カテゴリ一覧（楽器カテゴリのタイル）
3. 商品一覧（フィルタ：メーカー・カテゴリ・価格帯）
4. 商品詳細（スペック表 / 画像）

**Claude Code への投げ方例**:
```
公開サイトの3ページを作成:

1. src/app/(public)/page.tsx
   - ヒーロー: SOUND·TRADE のブランドコンセプト
   - 取扱メーカー一覧（現状は YAMAHA のみ、将来拡張）
   - 注目カテゴリ（管楽器カテゴリ）
   - 「見積フロー」の説明セクション

2. src/app/(public)/catalog/[category]/page.tsx
   - 該当カテゴリの商品一覧
   - フィルタ: メーカー / 価格帯 / 仕上げ
   - ソート: 価格昇順 / 降順 / 新着

3. src/app/(public)/products/[handle]/page.tsx
   - 商品画像（プレースホルダーOK）
   - 商品名・メーカー・カテゴリ
   - スペック表（product_specs から動的に）
   - 価格・在庫ステータス
   - 「見積カートに追加」ボタン

データは Supabase から Server Component で取得。
moheim 風の余白とタイポを徹底。
```

### Day 12-13（金・土）: 見積カート・依頼フォーム

**やること**:
1. 見積カート機能（クライアントサイドで localStorage / Zustand 等）
2. 見積依頼フォーム（会社名・担当者・連絡先・備考）
3. Server Action で `inquiries` テーブルに保存
4. Resend でメール送信（自分宛 + 顧客宛）

**Claude Code への投げ方例**:
```
見積カート〜送信完了までを実装:

1. 見積カート機能（localStorage ベース、Zustand 推奨）
   - 商品追加・削除・数量変更
   - カート一覧画面

2. src/app/(public)/cart/page.tsx
   - カート内商品一覧
   - 「見積依頼に進む」ボタン

3. src/app/(public)/inquiry/page.tsx
   - フォーム: 会社名・担当者名・メール・電話・納期希望・備考
   - Server Action で送信処理

4. 送信処理（Server Action）
   - inquiries テーブルに保存
   - inquiry_items にカート内容を保存
   - Resend で自社宛・顧客宛にメール送信
   - リダイレクトで送信完了ページへ

5. src/app/(public)/inquiry/complete/page.tsx
   - 受付番号表示
   - お礼メッセージ

入力バリデーションは zod で。
```

### Day 14（日）: 動作確認・微調整

**やること**:
- 公開サイト全ページの動作確認
- レスポンシブ確認（スマホ・タブレット）
- リファクタ・微調整

---

## Week 3: 管理画面（Day 15〜21）

### Day 15-16（月・火）: 認証・レイアウト

**やること**:
1. Supabase Auth で管理者ログイン画面
2. 管理画面共通レイアウト（サイドバー + ヘッダー）
3. **文字サイズ切替UI**（ヘッダー右上、3段階）
4. ダッシュボード（今日の見積依頼数、月次推移グラフ）

**Claude Code への投げ方例**:
```
管理画面のレイアウトと認証を実装:

1. src/app/(admin)/login/page.tsx
   - Supabase Auth（メール+パスワード）
   - エラーメッセージは色+アイコン+テキストの三重表現

2. src/app/(admin)/layout.tsx
   - サイドバー: ダッシュボード / 見積依頼 / 商品 / インポート /
     プレビュー / スナップショット / 監査ログ / 設定
   - ヘッダー: ロゴ + 文字サイズ切替UI(A-/A/A+) + ユーザーメニュー
   - 認証ガード（未ログインはログイン画面へ）

3. 文字サイズ切替UI
   - localStorage に保存
   - data-size="sm/md/lg" を html 要素に付与
   - CSS変数で全画面のフォントサイズを切り替え
   - docs/design_tokens.md の「管理画面」セクション参照

4. src/app/(admin)/dashboard/page.tsx
   - 今日の見積依頼数（カード）
   - 未対応件数（カード）
   - 月次推移（recharts でシンプルな棒グラフ）

全コンポーネントで Noto Sans JP / UD配色 を徹底。
```

### Day 17-18（水・木）: 商品管理・見積依頼管理

**やること**:
1. 商品マスタ一覧 / 詳細編集
2. バリアント編集
3. 見積依頼一覧 / 詳細 / ステータス変更

**Claude Code への投げ方例**:
```
管理画面の基本機能を実装:

1. src/app/(admin)/products/
   - page.tsx: 商品一覧（テーブル形式、検索・フィルタ）
   - [id]/page.tsx: 商品詳細・編集フォーム
   - [id]/variants/page.tsx: バリアント編集

2. src/app/(admin)/inquiries/
   - page.tsx: 見積依頼一覧
   - [id]/page.tsx: 詳細 + ステータス変更（未対応→対応中→完了）

ボタン最小 44x44、UD配色徹底。破壊的操作（削除）は確認モーダル必須。
```

### Day 19-20（金・土）: CSVインポート機能（最重要・最重い）

**やること**:
1. CSV アップロードUI
2. スキーマ検証ロジック（lib/csv/validator.ts）
3. ステージング書込（API Route or Server Action）
4. データ検証（バリデーション）
5. エラー一覧・修正UI

**Claude Code への投げ方例**:
```
CSV一括インポート機能を実装。docs/import_flow_spec.md の Step 1〜6 まで。

1. src/app/(admin)/imports/page.tsx
   - インポートジョブ一覧（最近10件）
   - 「新規インポート」ボタン

2. src/app/(admin)/imports/new/page.tsx
   - ファイルアップロードUI（drag&drop対応）
   - Shopify標準 / 4ファイル分割版を受付

3. src/lib/csv/
   - parser.ts: papaparse でパース
   - validator.ts: スキーマ検証 + データ検証
   - validator.test.ts: ユニットテスト必須

4. API Route: /api/imports/upload
   - ファイル受領 → import_jobs 作成
   - papaparse でパース
   - products_staging に書き込み
   - バリデーション実行 → import_errors に記録

5. src/app/(admin)/imports/[jobId]/page.tsx
   - エラー/警告サマリー表示
   - エラー一覧（severity 別）
   - 行クリックで修正モーダル
   - 「再検証」ボタン

エラーコードは docs/import_flow_spec.md の「主なエラーコード」表通り。
```

**所要時間が一番長い**。じっくり時間を取る。

### Day 21（日）: 擬似プレビュー機能

**Claude Code への投げ方例**:
```
擬似プレビュー機能を実装:

1. src/app/(admin)/preview/[jobId]/page.tsx
   - products_staging から取得した商品を、公開サイトと同じUIで表示
   - 表示モード切替: 全商品 / 新規のみ / 変更のみ

2. src/app/(admin)/preview/[jobId]/products/[handle]/page.tsx
   - 商品詳細プレビュー
   - 差分表示モード: 既存products と staging を並べて比較
   - 変更フィールドは黄色背景でハイライト

公開サイトのコンポーネントを再利用。プレビューモードバナー
（最上部に「プレビューモード - 反映前データ」表示）を必ず付ける。
```

---

## Week 4: 仕上げ・公開（Day 22〜30）

### Day 22-23（月・火）: 承認・反映フロー

**Claude Code への投げ方例**:
```
docs/import_flow_spec.md の Step 8〜11 を実装:

1. 「反映」ボタン + 確認モーダル
   - 変更件数を表示
   - 取り消せない旨を明記
   - キャンセル左 / 実行右

2. 反映処理（API Route: /api/imports/[jobId]/apply）
   - ① pre-import スナップショット作成（products/variants/specs を JSONB で）
   - ② products テーブルへ UPSERT
   - ③ post-import スナップショット作成
   - ④ import_jobs.status を 'completed' に
   - ⑤ audit_logs に記録
   - ⑥ Resend で完了通知メール

3. トランザクション内で実行し、失敗時は自動ロールバック

権限は editor 以上のみ。client は「反映申請」のみ可能。
```

### Day 24-25（水・木）: UD対応の最終調整

**やること**:
- アクセシビリティ確認（WAVE / axe DevTools）
- キーボード操作確認
- スクリーンリーダー対応（aria-label など）
- コントラスト比チェック

**Claude Code への投げ方例**:
```
管理画面全体のアクセシビリティを総点検:

1. 全ボタンに aria-label
2. 全フォームに適切な label
3. 状態表示すべてに「色+アイコン+テキスト」三重表現を再確認
4. キーボードナビゲーション（Tab で全要素にアクセス可能）
5. コントラスト比 4.5:1 以上を全画面で確認
6. axe DevTools で 0 件を目指す

特に CSV インポートの修正UI周りを重点的に。
```

### Day 26-27（金・土）: SEO・パフォーマンス

**Claude Code への投げ方例**:
```
SEO とパフォーマンスを仕上げ:

1. メタタグ
   - 各ページに適切な title / description / OGP
   - 商品ページは商品名 + メーカー + カテゴリ

2. サイトマップ
   - app/sitemap.ts で動的生成
   - 商品ページ全件を含む

3. robots.txt
   - 管理画面は Disallow
   - サイトマップ参照

4. 画像最適化
   - next/image で全画像を最適化
   - WebP 自動変換

5. パフォーマンス
   - Lighthouse で LCP 2.5秒以内を目指す
   - 不要な Client Component を Server Component に変換

6. Analytics
   - GA4 タグ設置（next/script で head）
   - GTM（オプション）
```

### Day 28-30（日〜火）: 本番公開

**やること**:
1. 本番ドメイン設定（Vercel + DNS）
2. 本番環境変数を Vercel に登録
3. Supabase 本番 → ステージング切替
4. 総合動作確認
5. **公開！**

**Claude Code への投げ方例**:
```
本番公開の最終確認:

1. 環境変数チェック（本番用 Supabase URL / Key / Resend Key 全部 OK か）
2. RLS 全テーブル有効か確認
3. 全ページ動作確認チェックリスト作成
4. 公開直後のモニタリング用に、エラー検知の仕組み（Sentry オプション）
5. 公開告知文の下書き（メール / Slack 用）
```

---

## マイルストーン確認用チェックリスト

### Week 1 終了時 ✅

- [ ] Next.js プロジェクトが起動する
- [ ] Supabase に全テーブルがある
- [ ] YAMAHA 294商品データが投入済み
- [ ] Vercel preview URL でアクセスできる

### Week 2 終了時 ✅

- [ ] トップページが見られる
- [ ] カテゴリ一覧が見られる
- [ ] 商品詳細が見られる
- [ ] 見積カートに追加できる
- [ ] 見積依頼フォームから送信できる
- [ ] 通知メールが届く

### Week 3 終了時 ✅

- [ ] 管理画面にログインできる
- [ ] ダッシュボードが見られる
- [ ] 文字サイズ切替が効く
- [ ] 商品マスタを編集できる
- [ ] 見積依頼を確認・対応できる
- [ ] CSV をアップロードできる
- [ ] バリデーションエラーが表示される
- [ ] エラーを修正できる
- [ ] 擬似プレビューが見られる

### Week 4 終了時 ✅

- [ ] CSV を本番反映できる
- [ ] スナップショットが自動作成される
- [ ] 監査ログに記録される
- [ ] アクセシビリティ 4.5:1 以上クリア
- [ ] Lighthouse スコア 90 以上
- [ ] 本番ドメインで公開済み

---

## 想定リスクと対処

| リスク | 対処 |
|---|---|
| CSVインポート機能が複雑で時間オーバー | Phase 2 機能（一括修正等）は後回し、最低限の動くものを優先 |
| デザインの微調整に時間取られる | Week 4 で集中対応、Week 2-3 は機能優先 |
| Supabase の RLS で詰まる | サポート豊富、Claude Code に「RLS ポリシーを書いて」と頼む |
| Resend の到達率問題 | SPF / DKIM 設定をドメイン側で必ず行う |
| 本番反映ミス | スナップショットがあるので、最悪は手動 SQL でリストア |

---

## Phase 2（公開後）でやること

優先順:
1. **完全ロールバック実行UI** — スナップショット一覧から1クリックで戻す
2. **一括修正機能** — 同種エラーをまとめて修正
3. **追加メーカー対応** — Roland / KORG / 他のシードデータ整備
4. **通知カスタマイズ** — 通知タイミング・宛先のテンプレ化
5. **スケジュール反映** — 「指定日時に反映」機能
6. **多言語対応**（英語）
7. **PDF見積書自動生成**
8. **LINE 公式アカウント連携**

---

これで30日間の道筋が見えました。
じっくり着実に進めて、6月の公開を目指しましょう 🚀
