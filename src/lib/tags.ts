/**
 * products.tags はカンマ区切りの TEXT。表示・絞り込みで配列化して使う。
 */
export function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

/** 配列をカンマ区切り文字列に戻す（保存用） */
export function joinTags(tags: string[]): string {
  return tags
    .map((t) => t.trim())
    .filter(Boolean)
    .join(", ");
}
