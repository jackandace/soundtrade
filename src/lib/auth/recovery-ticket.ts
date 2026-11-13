import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// 再設定メールのリンクを検証した「証明書」を署名付き Cookie で持たせる。
// recovery セッションは通常ログインと区別できないため、これがないと
// ログイン中の誰もが現在のパスワード無しで /admin/reset-password から変更できてしまう。

const COOKIE_NAME = "st_pw_recovery";
const COOKIE_PATH = "/admin/reset-password";
const TTL_MS = 60 * 60 * 1000; // 1 時間（Supabase の OTP 既定有効期限に合わせる）

function secret(): string {
  const s = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(`pw-recovery:${payload}`).digest("base64url");
}

export function issueRecoveryTicket(userId: string): void {
  const exp = Date.now() + TTL_MS;
  const payload = `${userId}.${exp}`;
  cookies().set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: COOKIE_PATH,
    maxAge: Math.floor(TTL_MS / 1000),
  });
}

export function hasValidRecoveryTicket(userId: string): boolean {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return false;
  const parts = raw.split(".");
  if (parts.length !== 3) return false;
  const [id, expStr, sig] = parts as [string, string, string];
  if (id !== userId) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;

  const expected = Buffer.from(sign(`${id}.${expStr}`));
  const actual = Buffer.from(sig);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function clearRecoveryTicket(): void {
  cookies().set(COOKIE_NAME, "", { path: COOKIE_PATH, maxAge: 0 });
}
