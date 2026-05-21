-- ============================================================
-- SOUND·TRADE  Migration 01: ベーステーブル
-- ============================================================
-- 商品マスタの中核テーブル群。
-- products / variants / product_specs / categories / makers /
-- inquiries / inquiry_items / customers / admin_users
--
-- カラム構成は YAMAHA Shopify CSV データセットに準拠。
-- ============================================================

-- 必要拡張
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()

-- ============================================================
-- makers（メーカー）
-- ============================================================
CREATE TABLE makers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,          -- 'yamaha' 等
  name        TEXT NOT NULL,                 -- 'YAMAHA'
  name_en     TEXT,
  logo_url    TEXT,                          -- ロゴ画像（メーカーロゴバー用）
  description TEXT,
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- categories（カテゴリ階層）
-- ============================================================
-- 3階層：管楽器 > クラリネット > B♭&Aクラリネット
-- parent_id による自己参照ツリー
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,          -- 'clarinet' 等
  name        TEXT NOT NULL,                 -- 'クラリネット'
  name_en     TEXT,
  parent_id   UUID REFERENCES categories(id) ON DELETE CASCADE,
  level       INTEGER NOT NULL DEFAULT 1,    -- 1=大分類 2=中分類 3=小分類
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_level ON categories(level);

-- ============================================================
-- products（商品マスタ本体）
-- ============================================================
-- CSV products_*.csv のカラムに準拠。
-- 価格は完全クローズ運用だが、金額データ自体はDBに保持する。
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 識別子
  handle          TEXT NOT NULL UNIQUE,      -- URLスラッグ兼一意キー
  sku_base        TEXT NOT NULL,             -- 品番ベース

  -- 基本情報
  product_name    TEXT NOT NULL,
  maker           TEXT,                      -- メーカー名（表示用キャッシュ）
  maker_id        UUID REFERENCES makers(id),

  -- カテゴリ（CSVは l1/l2/l3 の文字列、正規化IDも保持）
  category_l1     TEXT,
  category_l2     TEXT,
  category_l3     TEXT,
  category_id     UUID REFERENCES categories(id),

  -- 説明
  description_short TEXT,
  description_long  TEXT,
  body_html       TEXT,

  -- 価格（税抜。公開サイトには出さないがDBは保持）
  msrp            INTEGER,                   -- 希望小売価格（税抜）
  msrp_incl_tax   INTEGER,                   -- 税込（参考保持）

  -- 状態
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('active', 'draft', 'archived')),
  origin_country  TEXT,
  made_in_japan   BOOLEAN DEFAULT FALSE,
  is_new          BOOLEAN DEFAULT FALSE,
  is_featured     BOOLEAN DEFAULT FALSE,

  -- 価格表示制御（完全クローズ運用。将来の個別解放に備え保持）
  price_visibility TEXT NOT NULL DEFAULT 'hidden'
                  CHECK (price_visibility IN ('hidden', 'visible')),

  -- SEO
  seo_title       TEXT,
  seo_description TEXT,

  -- 付帯
  tags            TEXT,                      -- カンマ区切り
  catalog_year    TEXT,
  raw_metafields  JSONB DEFAULT '{}'::jsonb,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_products_handle ON products(handle);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_maker ON products(maker_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;

-- ============================================================
-- variants（バリアント）
-- ============================================================
-- CSV variants_*.csv のカラムに準拠。
CREATE TABLE variants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  handle        TEXT NOT NULL,               -- 親productのhandle（参照用）

  variant_sku   TEXT NOT NULL UNIQUE,
  variant_name  TEXT,
  color_hex     TEXT,
  variant_image TEXT,

  stock_status  TEXT DEFAULT 'in'
                CHECK (stock_status IN ('in', 'order', 'out')),
  stock_qty     INTEGER DEFAULT 0,
  msrp_variant  INTEGER,
  weight_kg     NUMERIC(8,2),
  barcode       TEXT,
  sort_order    INTEGER DEFAULT 0,

  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_variants_product ON variants(product_id);
CREATE INDEX idx_variants_sku ON variants(variant_sku);

-- ============================================================
-- product_specs（縦持ちスペック）
-- ============================================================
-- CSV product_specs_*.csv のカラムに準拠。
-- 1商品が複数のスペック行を持つ（key-value縦持ち）。
CREATE TABLE product_specs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  handle        TEXT NOT NULL,

  spec_key      TEXT NOT NULL,               -- 'category' 等
  spec_label    TEXT,                        -- 'カテゴリー'
  spec_value    TEXT,
  spec_group    TEXT,                        -- 'meta' 等のグループ
  sort_order    INTEGER DEFAULT 0,
  is_filterable BOOLEAN DEFAULT FALSE,        -- 絞り込みに使うか

  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_specs_product ON product_specs(product_id);
CREATE INDEX idx_specs_filterable ON product_specs(spec_key)
  WHERE is_filterable = TRUE;

-- ============================================================
-- product_images（商品画像）
-- ============================================================
-- 商品ごとの複数画像。実装フェーズで Supabase Storage と連携。
CREATE TABLE product_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  alt_text    TEXT,
  is_primary  BOOLEAN DEFAULT FALSE,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_images_product ON product_images(product_id);

-- ============================================================
-- customers（顧客マスタ）
-- ============================================================
-- 見積依頼から自動生成される。手動追加も可。
CREATE TABLE customers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name  TEXT NOT NULL,               -- 会社名・屋号
  contact_name  TEXT,                        -- 担当者名
  email         TEXT,
  phone         TEXT,
  address       TEXT,
  customer_type TEXT DEFAULT 'shop'          -- 'shop'|'studio'|'school'|'other'
                CHECK (customer_type IN ('shop','studio','school','other')),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_company ON customers(company_name);

-- ============================================================
-- inquiries（見積依頼）
-- ============================================================
CREATE TABLE inquiries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_number  TEXT NOT NULL UNIQUE,      -- 'ST-20260520-0042'

  -- 顧客情報（スナップショット的に保持。後の顧客マスタ編集の影響を受けない）
  customer_id     UUID REFERENCES customers(id),
  company_name    TEXT NOT NULL,
  contact_name    TEXT,
  email           TEXT NOT NULL,
  phone           TEXT,

  -- 依頼内容
  desired_delivery TEXT,                     -- 希望納期
  message         TEXT,                      -- 備考・要望

  -- ステータス
  status          TEXT NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new', 'in_progress', 'quoted', 'completed', 'cancelled')),

  -- 見積回答
  quoted_amount   INTEGER,                   -- 回答した見積金額（税抜）
  quoted_at       TIMESTAMPTZ,
  quote_pdf_url   TEXT,

  -- 担当
  assigned_to     UUID,                      -- admin_users.id（後のFKは migration 04 で）
  internal_notes  TEXT,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_number ON inquiries(inquiry_number);
CREATE INDEX idx_inquiries_created ON inquiries(created_at DESC);

-- ============================================================
-- inquiry_items（見積依頼の商品明細）
-- ============================================================
CREATE TABLE inquiry_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id    UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  product_id    UUID REFERENCES products(id),

  -- 商品情報スナップショット（依頼時点の値を保持）
  product_name  TEXT NOT NULL,
  product_handle TEXT,
  variant_sku   TEXT,
  quantity      INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  msrp_at_time  INTEGER,                     -- 依頼時点の希望小売価格

  -- 見積回答（明細単位）
  quoted_unit_price INTEGER,                 -- 回答単価

  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_inquiry_items_inquiry ON inquiry_items(inquiry_id);

-- ============================================================
-- announcements（お知らせ）
-- ============================================================
CREATE TABLE announcements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  body        TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_announcements_published ON announcements(is_published, published_at DESC);

-- ============================================================
-- updated_at 自動更新トリガー
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY['makers','categories','products','variants',
                        'customers','inquiries','announcements'])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
  END LOOP;
END $$;
