# SOUND·TRADE データベースマイグレーション

Week 1 Day 3-4 のDBスキーマ構築用。Supabase で順番に実行してください。

## 実行順序（重要）

ファイル名の番号順に実行します。FK依存があるため順序を守ること。

| # | ファイル | 内容 |
|---|---|---|
| 01 | `01_base_tables.sql` | 商品マスタ系（products / variants / specs / categories / makers / inquiries / customers / announcements） |
| 02 | `02_admin_users.sql` | 管理画面ユーザー + 権限判定関数 |
| 03 | `03_import_tables.sql` | CSV取込・ステージング系（staging / import_jobs / snapshots / errors） |
| 04 | `04_audit_settings.sql` | 監査ログ + システム設定 |
| 05 | `05_functions.sql` | ストアド関数（スナップショット / ロールバック / 採番） |
| 06 | `06_rls_policies.sql` | RLSポリシー（公開=読取専用 / 管理=認証必須） |
| 07 | `07_seed_yamaha.sql` | **シードデータ：YAMAHA管楽器 294商品**（01〜06の後に実行） |

### 07 シードデータについて

`07_seed_yamaha.sql` は YAMAHA管楽器の実データを投入します：
- 商品 294件（active 209 / draft 85）
- バリアント 303件
- スペック 3110行
- カテゴリ 9件（管楽器 + 8カテゴリ）/ メーカー 1件（YAMAHA）

何度実行しても安全です（先頭で既存データを消してから入れ直すため）。
これを実行すると、Supabase の Table Editor で294商品が並んで見えます。

## Supabase での実行方法

### 方法A: SQL Editor（手軽・推奨）

1. Supabase ダッシュボード → 左メニュー「SQL Editor」
2. 各ファイルの中身をコピーして貼り付け
3. **01 → 06 の順**に1ファイルずつ実行
4. エラーが出たら、その時点で止めて確認

### 方法B: Supabase CLI

```bash
# supabase/migrations/ にファイルを配置（YYYYMMDDHHMMSS_ プレフィックスを付ける）
supabase migration new base_tables
# → 生成されたファイルに 01_base_tables.sql の中身をコピー
# 以下、各ファイルぶん繰り返し

supabase db push
```

## 前提

- `auth.users` テーブル、`auth.uid()` 関数は Supabase が標準提供
- `anon` / `authenticated` ロールも Supabase 標準
- → ローカルの素のPostgreSQLで試す場合はこれらのスタブが必要

## 検証済み

このマイグレーション一式は PostgreSQL 16 で全6ファイルの実行を確認済み：
- 19テーブル作成成功
- カスタム関数8個（採番・スナップショット・ロールバック等）動作確認
- RLS 全19テーブルで有効化
- `system_settings` 初期値8件投入（`price.default_visibility = "hidden"` 含む）

## テーブル構成（19テーブル）

### 商品マスタ系（公開サイトが読む）
`products` `variants` `product_specs` `product_images` `categories` `makers` `announcements`

### 見積系
`inquiries` `inquiry_items` `customers`

### 管理・インポート系
`admin_users` `import_jobs` `products_staging` `variants_staging` `product_specs_staging` `import_errors`

### バックアップ・監査
`product_snapshots` `audit_logs` `system_settings`

## 主なストアド関数

| 関数 | 用途 |
|---|---|
| `create_product_snapshot()` | 商品データ一式をJSONBでスナップショット保存 |
| `rollback_to_snapshot()` | スナップショットから商品データを復元（Phase 2） |
| `cleanup_old_snapshots()` | 期限切れスナップショットの自動削除 |
| `generate_inquiry_number()` | 見積番号採番（ST-YYYYMMDD-NNNN形式） |
| `current_admin_role()` | ログイン中ユーザーのロール取得（RLS用） |
| `can_approve_import()` | 反映承認権限の判定（admin以上） |
| `can_rollback()` | ロールバック権限の判定（super_adminのみ） |
| `write_audit_log()` | 監査ログ記録ヘルパー |

## 権限設計（RLS）

| 対象 | 公開サイト（anon） | editor | admin | super_admin |
|---|---|---|---|---|
| 商品の閲覧 | ◯（active のみ） | ◯ | ◯ | ◯ |
| 商品の編集 | ✗ | ◯ | ◯ | ◯ |
| CSV取込・修正 | ✗ | ◯ | ◯ | ◯ |
| 反映承認 | ✗ | ✗ | ◯ | ◯ |
| ロールバック | ✗ | ✗ | ✗ | ◯ |
| ユーザー管理 | ✗ | ✗ | ✗ | ◯ |

公開時は admin / editor の2階層で運用（要件定義 v2.0）。

## 次のステップ

1. このマイグレーションを Supabase で実行
2. YAMAHA 294商品のシードデータ投入（`/mnt/user-data/outputs/wind_brochures/` のCSVから）
3. Day 5-7：シードデータ投入スクリプトの作成・実行
