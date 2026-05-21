-- ============================================================
-- SOUND·TRADE  Migration 03: インポート・ステージング系
-- ============================================================
-- CSV一括インポートの中核。
-- 即時反映せず staging に取り込み → 検証 → 承認 → 反映 の流れ。
--
-- 作成順序の注意：
--   product_snapshots → import_jobs → products_staging → ...
--   の順で作る（FK依存のため）。
-- ============================================================

-- ============================================================
-- product_snapshots（バックアップ）
-- ============================================================
-- 一括反映の前後で products テーブル一式をJSONBで丸ごと保存。
-- ロールバックの根幹。import_jobs より先に作る必要がある。
CREATE TABLE product_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  snapshot_type   TEXT NOT NULL
                  CHECK (snapshot_type IN ('pre_import','post_import','manual','scheduled')),
  triggered_by    UUID REFERENCES admin_users(id),
  triggered_by_name TEXT,
  related_job_id  UUID,                      -- import_jobs.id（FKは後で追加）

  -- データ本体：{ products:[...], variants:[...], product_specs:[...] }
  data            JSONB NOT NULL,

  -- 統計（クイック表示用）
  product_count   INTEGER DEFAULT 0,
  variant_count   INTEGER DEFAULT 0,
  spec_count      INTEGER DEFAULT 0,
  size_bytes      BIGINT DEFAULT 0,

  -- 保持管理
  is_protected    BOOLEAN DEFAULT FALSE,
  retention_until TIMESTAMPTZ,

  -- ロールバック使用記録
  used_for_rollback_at TIMESTAMPTZ,
  used_for_rollback_by UUID REFERENCES admin_users(id),

  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_snapshots_type ON product_snapshots(snapshot_type);
CREATE INDEX idx_snapshots_created ON product_snapshots(created_at DESC);
CREATE INDEX idx_snapshots_retention ON product_snapshots(retention_until)
  WHERE is_protected = FALSE;

-- ============================================================
-- import_jobs（インポートジョブ）
-- ============================================================
-- 1回のCSVインポート = 1 job。進行状況・統計を保持。
CREATE TABLE import_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  job_type        TEXT NOT NULL
                  CHECK (job_type IN ('shopify_csv','products_csv','split_csv')),
  source_filename TEXT,
  source_size     BIGINT,

  -- 操作者
  uploaded_by     UUID REFERENCES admin_users(id),
  uploader_name   TEXT,
  uploader_role   TEXT,

  -- ステータス遷移：
  -- pending → validating → reviewing → approved → applying → completed
  --                                  ↘ discarded   ↘ failed
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','validating','reviewing',
                                    'approved','applying','completed',
                                    'failed','discarded')),

  -- 統計
  total_rows         INTEGER DEFAULT 0,
  valid_rows         INTEGER DEFAULT 0,
  warning_rows       INTEGER DEFAULT 0,
  error_rows         INTEGER DEFAULT 0,
  new_products       INTEGER DEFAULT 0,
  updated_products   INTEGER DEFAULT 0,
  unchanged_products INTEGER DEFAULT 0,

  -- スナップショット紐づけ
  snapshot_id_before UUID REFERENCES product_snapshots(id),
  snapshot_id_after  UUID REFERENCES product_snapshots(id),

  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  validated_at    TIMESTAMPTZ,
  approved_at     TIMESTAMPTZ,
  applied_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ
);
CREATE INDEX idx_jobs_status ON import_jobs(status);
CREATE INDEX idx_jobs_uploader ON import_jobs(uploaded_by);
CREATE INDEX idx_jobs_created ON import_jobs(created_at DESC);

-- product_snapshots.related_job_id の FK を後付け
ALTER TABLE product_snapshots
  ADD CONSTRAINT fk_snapshots_job
  FOREIGN KEY (related_job_id) REFERENCES import_jobs(id) ON DELETE SET NULL;

-- ============================================================
-- products_staging（下書き商品データ）
-- ============================================================
-- CSV取込データの一時置き場。products と同じ構造 + 検証情報。
CREATE TABLE products_staging (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_job_id   UUID NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,

  -- 商品データ（products と同一構造）
  handle          TEXT NOT NULL,
  sku_base        TEXT NOT NULL,
  product_name    TEXT,
  maker           TEXT,
  category_l1     TEXT,
  category_l2     TEXT,
  category_l3     TEXT,
  description_short TEXT,
  description_long  TEXT,
  msrp            INTEGER,
  msrp_incl_tax   INTEGER,
  status          TEXT,
  origin_country  TEXT,
  made_in_japan   BOOLEAN,
  is_new          BOOLEAN,
  is_featured     BOOLEAN,
  seo_title       TEXT,
  seo_description TEXT,
  body_html       TEXT,
  tags            TEXT,
  catalog_year    TEXT,
  raw_metafields  JSONB DEFAULT '{}'::jsonb,

  -- 検証情報
  validation_status TEXT NOT NULL DEFAULT 'pending'
                  CHECK (validation_status IN ('pending','valid','warning','error')),
  validation_errors JSONB DEFAULT '[]'::jsonb,

  -- 差分情報（既存 products との比較結果）
  diff_status     TEXT
                  CHECK (diff_status IN ('new','update','unchanged','conflict')),
  existing_product_id UUID REFERENCES products(id),

  -- 操作フラグ
  is_modified_by_admin BOOLEAN DEFAULT FALSE,
  is_approved          BOOLEAN DEFAULT FALSE,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (import_job_id, handle)
);
CREATE INDEX idx_staging_job ON products_staging(import_job_id);
CREATE INDEX idx_staging_status ON products_staging(validation_status);
CREATE INDEX idx_staging_diff ON products_staging(diff_status);

-- ============================================================
-- variants_staging
-- ============================================================
CREATE TABLE variants_staging (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_job_id   UUID NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  staging_product_id UUID REFERENCES products_staging(id) ON DELETE CASCADE,

  handle          TEXT NOT NULL,
  variant_sku     TEXT NOT NULL,
  variant_name    TEXT,
  color_hex       TEXT,
  variant_image   TEXT,
  stock_status    TEXT,
  stock_qty       INTEGER,
  msrp_variant    INTEGER,
  weight_kg       NUMERIC(8,2),
  barcode         TEXT,
  sort_order      INTEGER,

  validation_status TEXT DEFAULT 'pending'
                  CHECK (validation_status IN ('pending','valid','warning','error')),
  validation_errors JSONB DEFAULT '[]'::jsonb,

  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_variants_staging_job ON variants_staging(import_job_id);

-- ============================================================
-- product_specs_staging
-- ============================================================
CREATE TABLE product_specs_staging (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_job_id   UUID NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  staging_product_id UUID REFERENCES products_staging(id) ON DELETE CASCADE,

  handle          TEXT NOT NULL,
  spec_key        TEXT NOT NULL,
  spec_label      TEXT,
  spec_value      TEXT,
  spec_group      TEXT,
  sort_order      INTEGER,
  is_filterable   BOOLEAN,

  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_specs_staging_job ON product_specs_staging(import_job_id);

-- ============================================================
-- import_errors（バリデーションエラー詳細）
-- ============================================================
-- 各行・各セルごとのエラー。修正UIで一覧表示する。
CREATE TABLE import_errors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_job_id   UUID NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  staging_product_id UUID REFERENCES products_staging(id) ON DELETE CASCADE,

  severity        TEXT NOT NULL
                  CHECK (severity IN ('error','warning','info')),
  error_code      TEXT NOT NULL,
    -- 'MISSING_HANDLE' | 'MISSING_SKU' | 'DUPLICATE_HANDLE' | 'DUPLICATE_SKU'
    -- | 'PRICE_ZERO_WITH_ACTIVE' | 'INVALID_STATUS' | 'INVALID_CATEGORY'
    -- | 'CSV_SCHEMA_MISMATCH' | 'SEO_TITLE_TOO_LONG' | 'INVALID_IMAGE_URL' 等

  row_number      INTEGER,
  field_name      TEXT,
  field_value     TEXT,
  message         TEXT NOT NULL,
  suggestion      TEXT,

  is_resolved     BOOLEAN DEFAULT FALSE,
  resolved_at     TIMESTAMPTZ,
  resolved_by     UUID REFERENCES admin_users(id),

  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_errors_job ON import_errors(import_job_id);
CREATE INDEX idx_errors_severity ON import_errors(severity);
CREATE INDEX idx_errors_unresolved ON import_errors(import_job_id, is_resolved)
  WHERE is_resolved = FALSE;

-- ============================================================
-- updated_at トリガー（staging）
-- ============================================================
CREATE TRIGGER trg_products_staging_updated BEFORE UPDATE ON products_staging
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
