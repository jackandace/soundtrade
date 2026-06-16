/**
 * 定価（メーカー希望小売価格・税込）の表示ヘルパー。
 *
 * 設計方針（2026-05 改定）:
 * - 公開サイトでは「定価（参考）」のみ表示する。実際の卸価格は見積依頼で個別案内。
 * - 価格が 0 / null の商品（特別生産品など）は定価を出さず「お見積もり対応」のみ。
 */

export function formatYen(value: number): string {
  return `¥${value.toLocaleString("ja-JP")}`;
}

/** 定価として表示してよい値か（0・null・負数は表示しない） */
export function hasListPrice(msrpInclTax: number | null | undefined): boolean {
  return typeof msrpInclTax === "number" && msrpInclTax > 0;
}

/** 表示用の定価文字列。表示不可なら null。 */
export function formatListPrice(
  msrpInclTax: number | null | undefined,
): string | null {
  if (!hasListPrice(msrpInclTax)) return null;
  return `${formatYen(msrpInclTax as number)}（税込）`;
}
