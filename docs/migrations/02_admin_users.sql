-- ============================================================
-- SOUND·TRADE  Migration 02: 管理画面ユーザー
-- ============================================================
-- admin_users は Supabase Auth の auth.users と 1:1 で対応。
-- id は auth.users.id をそのまま使う（外部キー）。
--
-- 公開サイトには認証なし。管理画面のみ認証あり。
-- ============================================================

CREATE TABLE admin_users (
  -- Supabase Auth の auth.users.id をそのまま主キーに使う
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  email         TEXT NOT NULL,
  display_name  TEXT NOT NULL,

  -- 権限ロール
  -- 要件定義 v2.0：公開時は admin / editor の2階層で運用。
  -- super_admin / client は将来拡張用に CHECK には含めておく。
  role          TEXT NOT NULL DEFAULT 'editor'
                CHECK (role IN ('super_admin', 'admin', 'editor', 'client')),

  -- 追加権限（細かい制御が必要になった場合に使用）
  permissions   JSONB DEFAULT '{}'::jsonb,

  -- 管理画面の個人設定
  -- font_size: ユニバーサルデザインの文字サイズ設定を記憶
  font_size     TEXT DEFAULT 'md'
                CHECK (font_size IN ('sm', 'md', 'lg')),

  is_active     BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_email ON admin_users(email);

CREATE TRIGGER trg_admin_users_updated BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- inquiries.assigned_to の外部キーを今ここで追加
-- （migration 01 時点では admin_users が未作成だったため）
-- ============================================================
ALTER TABLE inquiries
  ADD CONSTRAINT fk_inquiries_assigned
  FOREIGN KEY (assigned_to) REFERENCES admin_users(id) ON DELETE SET NULL;

-- ============================================================
-- 権限判定のヘルパー関数
-- ============================================================
-- RLSポリシーや業務ロジックから呼ぶ。
-- 現在ログイン中ユーザーのロールを返す。
CREATE OR REPLACE FUNCTION current_admin_role()
RETURNS TEXT AS $$
  SELECT role FROM admin_users WHERE id = auth.uid() AND is_active = TRUE;
$$ LANGUAGE sql STABLE;

-- 反映承認できるロールか（admin / super_admin）
CREATE OR REPLACE FUNCTION can_approve_import()
RETURNS BOOLEAN AS $$
  SELECT current_admin_role() IN ('super_admin', 'admin');
$$ LANGUAGE sql STABLE;

-- ロールバック実行できるロールか（super_admin のみ）
CREATE OR REPLACE FUNCTION can_rollback()
RETURNS BOOLEAN AS $$
  SELECT current_admin_role() = 'super_admin';
$$ LANGUAGE sql STABLE;
