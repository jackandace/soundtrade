-- ============================================================
-- SOUND·TRADE  Migration 06: RLS（Row Level Security）ポリシー
-- ============================================================
-- 方針：
--   公開サイト … 認証なし（anon）。公開中の商品だけ読める。
--   管理画面   … 認証あり。admin_users に登録された人だけ操作可。
--   反映承認   … admin / super_admin のみ。
--   ロールバック … super_admin のみ。
-- ============================================================

-- ============================================================
-- 公開サイト向け：読み取り専用テーブル
-- ============================================================
-- products / variants / product_specs / product_images /
-- categories / makers / announcements は anon が SELECT 可能。
-- ただし products は status='active' のみ。

ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_specs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE makers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements  ENABLE ROW LEVEL SECURITY;

-- 公開サイト：公開中の商品のみ閲覧可
CREATE POLICY public_read_active_products ON products
  FOR SELECT TO anon, authenticated
  USING (status = 'active');

-- 公開中商品に紐づくバリアント・スペック・画像
CREATE POLICY public_read_variants ON variants
  FOR SELECT TO anon, authenticated
  USING (product_id IN (SELECT id FROM products WHERE status = 'active'));

CREATE POLICY public_read_specs ON product_specs
  FOR SELECT TO anon, authenticated
  USING (product_id IN (SELECT id FROM products WHERE status = 'active'));

CREATE POLICY public_read_images ON product_images
  FOR SELECT TO anon, authenticated
  USING (product_id IN (SELECT id FROM products WHERE status = 'active'));

-- カテゴリ・メーカーは有効なものを公開
CREATE POLICY public_read_categories ON categories
  FOR SELECT TO anon, authenticated USING (is_active = TRUE);

CREATE POLICY public_read_makers ON makers
  FOR SELECT TO anon, authenticated USING (is_active = TRUE);

-- お知らせは公開済みのみ
CREATE POLICY public_read_announcements ON announcements
  FOR SELECT TO anon, authenticated USING (is_published = TRUE);

-- ============================================================
-- 管理画面：全商品データの編集（admin_users のみ）
-- ============================================================
-- anon の読み取りポリシーとは別に、管理者向けの全権ポリシーを足す。
CREATE POLICY admin_all_products ON products
  FOR ALL TO authenticated
  USING (current_admin_role() IS NOT NULL)
  WITH CHECK (current_admin_role() IS NOT NULL);

CREATE POLICY admin_all_variants ON variants
  FOR ALL TO authenticated
  USING (current_admin_role() IS NOT NULL)
  WITH CHECK (current_admin_role() IS NOT NULL);

CREATE POLICY admin_all_specs ON product_specs
  FOR ALL TO authenticated
  USING (current_admin_role() IS NOT NULL)
  WITH CHECK (current_admin_role() IS NOT NULL);

CREATE POLICY admin_all_images ON product_images
  FOR ALL TO authenticated
  USING (current_admin_role() IS NOT NULL)
  WITH CHECK (current_admin_role() IS NOT NULL);

CREATE POLICY admin_all_categories ON categories
  FOR ALL TO authenticated
  USING (current_admin_role() IS NOT NULL)
  WITH CHECK (current_admin_role() IS NOT NULL);

CREATE POLICY admin_all_makers ON makers
  FOR ALL TO authenticated
  USING (current_admin_role() IS NOT NULL)
  WITH CHECK (current_admin_role() IS NOT NULL);

CREATE POLICY admin_all_announcements ON announcements
  FOR ALL TO authenticated
  USING (current_admin_role() IS NOT NULL)
  WITH CHECK (current_admin_role() IS NOT NULL);

-- ============================================================
-- 見積依頼：作成は公開（フォーム送信）、閲覧・更新は管理者
-- ============================================================
ALTER TABLE inquiries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers     ENABLE ROW LEVEL SECURITY;

-- 公開フォームからの見積依頼の登録を許可（INSERTのみ）
CREATE POLICY public_create_inquiry ON inquiries
  FOR INSERT TO anon, authenticated WITH CHECK (TRUE);

CREATE POLICY public_create_inquiry_items ON inquiry_items
  FOR INSERT TO anon, authenticated WITH CHECK (TRUE);

-- 管理者は見積依頼を全操作可
CREATE POLICY admin_all_inquiries ON inquiries
  FOR ALL TO authenticated
  USING (current_admin_role() IS NOT NULL)
  WITH CHECK (current_admin_role() IS NOT NULL);

CREATE POLICY admin_all_inquiry_items ON inquiry_items
  FOR ALL TO authenticated
  USING (current_admin_role() IS NOT NULL)
  WITH CHECK (current_admin_role() IS NOT NULL);

-- 顧客マスタは管理者のみ
CREATE POLICY admin_all_customers ON customers
  FOR ALL TO authenticated
  USING (current_admin_role() IS NOT NULL)
  WITH CHECK (current_admin_role() IS NOT NULL);

-- ============================================================
-- 管理画面専用テーブル：認証必須
-- ============================================================
ALTER TABLE admin_users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE products_staging     ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants_staging     ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_specs_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_errors        ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_snapshots    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings      ENABLE ROW LEVEL SECURITY;

-- admin_users：本人は自分の行を読める。管理者は全員ぶん読める。
CREATE POLICY admin_users_self_read ON admin_users
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR current_admin_role() IN ('super_admin','admin'));

-- admin_users：本人は自分の設定（font_size等）を更新できる
CREATE POLICY admin_users_self_update ON admin_users
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- admin_users：ユーザー管理は super_admin のみ
CREATE POLICY admin_users_manage ON admin_users
  FOR ALL TO authenticated
  USING (current_admin_role() = 'super_admin')
  WITH CHECK (current_admin_role() = 'super_admin');

-- インポート系：admin_users 全員（client含む）が操作可
CREATE POLICY admin_all_import_jobs ON import_jobs
  FOR ALL TO authenticated
  USING (current_admin_role() IS NOT NULL)
  WITH CHECK (current_admin_role() IS NOT NULL);

CREATE POLICY admin_all_staging ON products_staging
  FOR ALL TO authenticated
  USING (current_admin_role() IS NOT NULL)
  WITH CHECK (current_admin_role() IS NOT NULL);

CREATE POLICY admin_all_variants_staging ON variants_staging
  FOR ALL TO authenticated
  USING (current_admin_role() IS NOT NULL)
  WITH CHECK (current_admin_role() IS NOT NULL);

CREATE POLICY admin_all_specs_staging ON product_specs_staging
  FOR ALL TO authenticated
  USING (current_admin_role() IS NOT NULL)
  WITH CHECK (current_admin_role() IS NOT NULL);

CREATE POLICY admin_all_import_errors ON import_errors
  FOR ALL TO authenticated
  USING (current_admin_role() IS NOT NULL)
  WITH CHECK (current_admin_role() IS NOT NULL);

-- スナップショット：閲覧・作成は admin 以上、更新（ロールバック使用）は super_admin
CREATE POLICY snapshot_read ON product_snapshots
  FOR SELECT TO authenticated
  USING (current_admin_role() IN ('super_admin','admin'));

CREATE POLICY snapshot_create ON product_snapshots
  FOR INSERT TO authenticated
  WITH CHECK (current_admin_role() IN ('super_admin','admin'));

CREATE POLICY snapshot_super_admin_modify ON product_snapshots
  FOR UPDATE TO authenticated
  USING (current_admin_role() = 'super_admin');

CREATE POLICY snapshot_super_admin_delete ON product_snapshots
  FOR DELETE TO authenticated
  USING (current_admin_role() = 'super_admin');

-- 監査ログ：admin / super_admin が閲覧のみ（書き込みは関数経由）
CREATE POLICY audit_read ON audit_logs
  FOR SELECT TO authenticated
  USING (current_admin_role() IN ('super_admin','admin'));

CREATE POLICY audit_insert ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (current_admin_role() IS NOT NULL);

-- システム設定：閲覧は管理者全員、変更は admin / super_admin
CREATE POLICY settings_read ON system_settings
  FOR SELECT TO authenticated
  USING (current_admin_role() IS NOT NULL);

CREATE POLICY settings_modify ON system_settings
  FOR ALL TO authenticated
  USING (current_admin_role() IN ('super_admin','admin'))
  WITH CHECK (current_admin_role() IN ('super_admin','admin'));

-- ============================================================
-- 補足
-- ============================================================
-- ・公開サイトは anon キーで products/variants/specs を読む。
-- ・管理画面は認証済セッションで全テーブルにアクセス。
-- ・サーバー側のバッチ処理（CSV反映など）は Service Role Key を
--   使うため RLS をバイパスする。反映ロジックはアプリ層で権限を確認すること。
