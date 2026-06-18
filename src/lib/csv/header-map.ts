/**
 * 取込ファイルの列名ゆれを吸収し、正規フィールドへマッピングする。
 * 日本語テンプレート / Shopify CSV / 分割CSV のいずれにも対応。
 */

export type CanonicalField =
  | "handle"
  | "sku_base"
  | "product_name"
  | "maker"
  | "category_l1"
  | "category_l2"
  | "category_l3"
  | "msrp_incl_tax"
  | "msrp"
  | "status"
  | "description_short"
  | "description_long"
  | "tags";

// 各正規フィールドに対して受け付ける列名（小文字・トリム済みで比較）
const ALIASES: Record<CanonicalField, string[]> = {
  handle: ["handle", "ハンドル", "url"],
  sku_base: ["sku_base", "品番", "型番", "sku", "商品コード", "品番(sku)"],
  product_name: ["product_name", "商品名", "品名", "title", "タイトル", "名称"],
  maker: ["maker", "メーカー", "vendor", "ブランド", "ブランド名", "製造元"],
  category_l1: ["category_l1", "カテゴリ大", "カテゴリ大分類", "大分類"],
  category_l2: [
    "category_l2",
    "カテゴリ中",
    "カテゴリ中分類",
    "中分類",
    "type",
    "楽器種別",
    "カテゴリ",
    "種別",
  ],
  category_l3: ["category_l3", "カテゴリ小", "カテゴリ小分類", "小分類"],
  msrp_incl_tax: [
    "msrp_incl_tax",
    "定価",
    "定価(税込)",
    "定価（税込）",
    "税込価格",
    "税込",
    "variant price",
    "販売価格",
    "価格",
  ],
  msrp: ["msrp", "希望小売価格", "税抜価格", "税抜", "卸価格"],
  status: ["status", "公開状態", "ステータス", "状態", "公開"],
  description_short: ["description_short", "説明", "商品説明", "概要", "説明文"],
  description_long: [
    "description_long",
    "詳細説明",
    "body (html)",
    "body_html",
    "本文",
  ],
  tags: ["tags", "タグ", "tag"],
};

function normKey(s: string): string {
  return (s ?? "").toString().trim().toLowerCase().replace(/\s+/g, " ");
}

/** ヘッダー配列 → {正規フィールド: 列index} */
export function mapHeaders(
  headers: string[],
): Partial<Record<CanonicalField, number>> {
  const normed = headers.map(normKey);
  const result: Partial<Record<CanonicalField, number>> = {};
  (Object.keys(ALIASES) as CanonicalField[]).forEach((field) => {
    for (const alias of ALIASES[field]) {
      const idx = normed.indexOf(alias);
      if (idx >= 0) {
        result[field] = idx;
        break;
      }
    }
  });
  return result;
}

/** Shopify 形式（Handle + バリアント列を持つ複数行形式）か判定 */
export function looksLikeShopify(headers: string[]): boolean {
  const normed = headers.map(normKey);
  const hasHandle = normed.includes("handle");
  const hasVariant =
    normed.includes("variant sku") || normed.includes("variant price");
  return hasHandle && hasVariant;
}

/** 公開状態の表記ゆれを active/draft/archived に正規化 */
export function normalizeStatus(raw: string | null): string | null {
  if (!raw) return null;
  const v = raw.toString().trim().toLowerCase();
  if (["公開", "公開中", "active", "true", "1", "○", "有効"].includes(v))
    return "active";
  if (["下書き", "draft", "準備中", "false", "0"].includes(v)) return "draft";
  if (["非公開", "archived", "終了", "廃番"].includes(v)) return "archived";
  if (["active", "draft", "archived"].includes(v)) return v;
  return null;
}

/** 品番・メーカーから handle を生成（英小文字・ハイフン） */
export function deriveHandle(maker: string | null, sku: string): string {
  const base = [maker, sku]
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/[♭ﾞ゙]/g, "b")
    .replace(/[♯#]/g, "s")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || sku.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/** 価格文字列 → 整数（カンマ・¥・全角を許容）。空は null */
export function parsePriceInt(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  const s = raw
    .toString()
    .replace(/[¥,，\s円]/g, "")
    .replace(/[０-９]/g, (d) => String("０１２３４５６７８９".indexOf(d)))
    .trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : null;
}
