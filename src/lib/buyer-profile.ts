/**
 * 見積依頼・お問い合わせの入力者情報をブラウザに記憶する（ログイン不要）。
 * 2回目以降のフォームを自動補完して再入力の手間を減らす。
 */
export type BuyerProfile = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
};

const KEY = "sound-trade-buyer";

export function loadBuyerProfile(): Partial<BuyerProfile> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const p = JSON.parse(raw);
    if (p && typeof p === "object") return p as Partial<BuyerProfile>;
  } catch {
    // ignore
  }
  return {};
}

export function saveBuyerProfile(p: BuyerProfile): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // ignore（プライベートモード等）
  }
}
