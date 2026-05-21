-- ============================================================
-- SOUND·TRADE  Migration 04: 監査ログ・システム設定
-- ============================================================

-- ============================================================
-- audit_logs（監査ログ）
-- ============================================================
-- 管理画面での重要操作を「誰が・いつ・何を・どこで」記録。
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 操作者（表示用に名前・ロールもキャッシュ）
  user_id         UUID REFERENCES admin_users(id),
  user_name       TEXT,
  user_role       TEXT,

  -- 操作内容
  action          TEXT NOT NULL,
    -- 'login' | 'logout'
    -- | 'import_upload' | 'import_validate' | 'import_approve'
    -- | 'import_apply' | 'import_discard'
    -- | 'product_create' | 'product_update' | 'product_delete'
    -- | 'rollback_execute'
    -- | 'snapshot_create' | 'snapshot_delete'
    -- | 'inquiry_status_change' | 'inquiry_quote'
    -- | 'settings_update'

  resource_type   TEXT,   -- 'product' | 'import_job' | 'snapshot' | 'inquiry' 等
  resource_id     UUID,

  -- 詳細（変更前後の差分など）
  payload         JSONB DEFAULT '{}'::jsonb,
  ip_address      TEXT,
  user_agent      TEXT,

  -- リスクレベル（フィルタ用）
  risk_level      TEXT DEFAULT 'normal'
                  CHECK (risk_level IN ('low','normal','high','critical')),

  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_risk ON audit_logs(risk_level, created_at DESC)
  WHERE risk_level IN ('high','critical');

-- ============================================================
-- system_settings（システム設定）
-- ============================================================
-- key-value 形式の設定ストア。値は JSONB。
CREATE TABLE system_settings (
  key             TEXT PRIMARY KEY,
  value           JSONB NOT NULL,
  description     TEXT,
  updated_by      UUID REFERENCES admin_users(id),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 初期値
INSERT INTO system_settings (key, value, description) VALUES
  ('snapshot.retention_days',    '30',      'スナップショット自動削除までの日数'),
  ('snapshot.max_generations',   '10',      '保持する最大世代数'),
  ('import.allow_client_upload', 'true',    'クライアントからのアップロードを許可'),
  ('import.require_approval',    'true',    'インポート反映に承認を必須にする'),
  ('price.default_visibility',   '"hidden"','公開サイトの価格表示既定（完全クローズ運用）'),
  ('notify.import_complete',     '"admin@example.com"', '反映完了通知の送信先'),
  ('notify.error',               '"admin@example.com"', 'エラー通知の送信先'),
  ('notify.new_inquiry',         '"admin@example.com"', '新規見積依頼の通知先')
ON CONFLICT (key) DO NOTHING;

CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 監査ログ記録ヘルパー関数
-- ============================================================
-- アプリ側から手軽に監査ログを残すための関数。
CREATE OR REPLACE FUNCTION write_audit_log(
  p_action        TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id   UUID DEFAULT NULL,
  p_payload       JSONB DEFAULT '{}'::jsonb,
  p_risk_level    TEXT DEFAULT 'normal'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_user   RECORD;
BEGIN
  SELECT id, display_name, role INTO v_user
  FROM admin_users WHERE id = auth.uid();

  INSERT INTO audit_logs (
    user_id, user_name, user_role,
    action, resource_type, resource_id, payload, risk_level
  ) VALUES (
    v_user.id, v_user.display_name, v_user.role,
    p_action, p_resource_type, p_resource_id, p_payload, p_risk_level
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
