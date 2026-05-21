export function getSiteUrl(): string {
  const v = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (v) {
    return v.endsWith("/") ? v.slice(0, -1) : v;
  }
  return "http://localhost:3000";
}

export const SITE_NAME = "SOUND·TRADE";
export const SITE_DEFAULT_DESCRIPTION =
  "管楽器・弦楽器・打楽器など主要メーカーの楽器をまとめて取り扱う卸プラットフォーム。楽器店・スタジオ・教育機関のお客様向け。";
