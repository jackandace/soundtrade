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

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export function getCategoryJp(id: string | null | undefined): string | null {
  if (!id) return null;
  return CATEGORIES.find((c) => c.id === id)?.jp ?? null;
}
