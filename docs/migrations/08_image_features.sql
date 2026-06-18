-- ============================================================
-- 08_image_features.sql
-- 画像まわりの機能追加（2026-06）
--   1. 型番（商品）に紐づかない画像も保存できるようにする
--   2. 画像一括取込の履歴テーブルを追加（ダウンロード用に結果も保持）
-- Supabase SQL Editor で実行してください。何度実行しても安全（IF NOT EXISTS / DROP NOT NULL）。
-- ============================================================

-- 1. product_images: 商品未登録でも画像だけ保存できるよう product_id を任意化
ALTER TABLE product_images ALTER COLUMN product_id DROP NOT NULL;

-- 取込時の型番（どの品番向けの画像だったか）を控える列
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS sku_ref TEXT;

CREATE INDEX IF NOT EXISTS idx_images_sku_ref ON product_images(sku_ref);

-- 2. 画像一括取込の履歴
CREATE TABLE IF NOT EXISTS image_import_jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename      TEXT,
  uploaded_by   UUID REFERENCES admin_users(id),
  uploader_name TEXT,

  total_rows    INTEGER DEFAULT 0,
  registered    INTEGER DEFAULT 0,   -- 商品に紐付けて登録
  unlinked      INTEGER DEFAULT 0,   -- 型番なしで登録（商品未登録）
  not_found     INTEGER DEFAULT 0,   -- 取込スキップ（旧仕様の名残・現在は unlinked に集約）
  skipped       INTEGER DEFAULT 0,   -- 既存画像ありでスキップ
  failed        INTEGER DEFAULT 0,   -- 取得/保存失敗

  -- 行ごとの結果（{sku, imageUrl, status, detail}[]）。ダウンロード用。
  results       JSONB DEFAULT '[]'::jsonb,

  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_image_import_jobs_created
  ON image_import_jobs(created_at DESC);

ALTER TABLE image_import_jobs ENABLE ROW LEVEL SECURITY;
-- 管理画面は service_role でアクセスするため RLS はバイパスされる。
-- 念のため anon/authenticated には何も許可しない（ポリシー無し = 不可）。
