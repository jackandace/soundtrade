-- ============================================================
-- 09_tag_master.sql
-- タグ管理（タグマスタ）。2026-06
--   タグを事前登録しておき、商品マスタで一括付与に使う。
--   各商品の実タグは従来どおり products.tags（カンマ区切り）に保持。
--   tag_master は「使えるタグの一覧（語彙）」を管理するための軽量テーブル。
-- Supabase SQL Editor で実行してください。何度実行しても安全。
-- ============================================================

CREATE TABLE IF NOT EXISTS tag_master (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tag_master_name ON tag_master(name);

ALTER TABLE tag_master ENABLE ROW LEVEL SECURITY;
-- 管理画面は service_role でアクセスするため RLS はバイパスされる。
-- anon/authenticated にはポリシー無し = 不可。
