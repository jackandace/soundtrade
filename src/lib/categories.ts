// クライアント/サーバ両用のカテゴリ・ユーティリティ（サーバ専用 import を含めない）。
// DB 集計の getCategoryNav() は server-only なので categories-server.ts に分離している。

export type CategoryChild = { name: string; count: number };
export type CategoryGroup = {
  name: string; // 大分類 (category_l1)
  count: number;
  children: CategoryChild[]; // 中分類 (category_l2)
};

/** 中分類をフラット化し、件数上位 n 件を返す（トップの「取扱カテゴリ」用） */
export function topCategories(
  groups: CategoryGroup[],
  n: number,
): CategoryChild[] {
  return groups
    .flatMap((g) => g.children)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ja"))
    .slice(0, n);
}

/** カタログのリンク先 URL を組み立てる */
export function catalogHrefL1(name: string): string {
  return `/catalog?l1=${encodeURIComponent(name)}`;
}
export function catalogHrefL2(name: string): string {
  return `/catalog?l2=${encodeURIComponent(name)}`;
}

// ─────────────────────────────────────────────
// レガシー（旧 ?category=<英字ID> リンクの後方互換用）
// 新規ナビは DB 連動の getCategoryNav() を使う。
// getCategoryJp は catalog の旧 category パラメータ受けにのみ残す。
// ─────────────────────────────────────────────

export const CATEGORIES = [
  { id: "clarinet", jp: "クラリネット", en: "Clarinet" },
  { id: "saxophone", jp: "サクソフォン", en: "Saxophone" },
  { id: "trumpet", jp: "トランペット", en: "Trumpet" },
  { id: "flute", jp: "フルート", en: "Flute" },
  { id: "horn", jp: "ホルン", en: "Horn" },
  { id: "trombone", jp: "トロンボーン", en: "Trombone" },
  { id: "recorder", jp: "リコーダー", en: "Recorder" },
  { id: "doublereed", jp: "ダブルリード", en: "Double Reed" },
] as const;

export function getCategoryJp(id: string | null | undefined): string | null {
  if (!id) return null;
  return CATEGORIES.find((c) => c.id === id)?.jp ?? null;
}
