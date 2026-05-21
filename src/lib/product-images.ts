export type ProductImageRef = {
  url: string;
  is_primary: boolean | null;
  sort_order: number | null;
};

/**
 * 商品カードに表示する 1 枚を選ぶ。
 * 優先度: is_primary=true → sort_order 昇順の先頭 → null
 */
export function pickPrimaryImage(
  images: ProductImageRef[] | null | undefined,
): string | null {
  if (!images || images.length === 0) return null;
  const primary = images.find((i) => i.is_primary === true);
  if (primary) return primary.url;
  const sorted = [...images].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  return sorted[0]?.url ?? null;
}
