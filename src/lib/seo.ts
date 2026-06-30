export function getSiteUrl(): string {
  const v = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (v) {
    return v.endsWith("/") ? v.slice(0, -1) : v;
  }
  // 本番ドメイン（未設定時のフォールバック）。Vercel で www が主のため www に統一。
  return "https://www.mitsuesu-music.com";
}

/** 表向きのサイト名 */
export const SITE_NAME = "楽器卸のミツエス";

/** ページ全体の既定タイトル（トップ用） */
export const SITE_TITLE =
  "楽器卸のミツエス｜楽器・楽譜・音響機器の卸見積もり";

/** meta description（検索結果の説明文） */
export const SITE_DEFAULT_DESCRIPTION =
  "楽器・楽譜・音響機器の仕入れなら、名古屋の楽器卸会社ミツエスへ。小売店・法人向けに、取扱商品の卸見積もりをスムーズにご依頼いただけます。";

/** OGP 用の説明文（SNS シェア時） */
export const SITE_OG_DESCRIPTION =
  "名古屋の楽器卸会社ミツエスが運営する、小売店・法人向けの卸見積もりサイトです。楽器・楽譜・音響機器の仕入れ相談に対応しています。";

/** 主要キーワード */
export const SITE_KEYWORDS = [
  "楽器卸",
  "楽譜卸",
  "音響機器 卸",
  "楽器 仕入れ",
  "楽譜 仕入れ",
  "楽器 卸 見積もり",
  "ミツエス",
];
