import { Resend } from "resend";

let cached: Resend | null | undefined;

export function getResend(): Resend | null {
  if (cached !== undefined) return cached;
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    cached = null;
    return null;
  }
  cached = new Resend(key);
  return cached;
}

export function getFromAddress(): string {
  const v = process.env.RESEND_FROM_EMAIL?.trim();
  if (v) return v;
  // Resend のサンドボックス送信元（自分のアカウントメール宛にしか届かない）
  return "SOUND·TRADE <onboarding@resend.dev>";
}

export async function getAdminEmails(
  fallbackSupabaseFetcher: () => Promise<string[]>,
): Promise<string[]> {
  const env = process.env.RESEND_ADMIN_EMAILS?.trim();
  if (env) {
    return env
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  try {
    return await fallbackSupabaseFetcher();
  } catch {
    return [];
  }
}

export type SendResult =
  | { ok: true; id: string }
  | { ok: false; reason: "not_configured" | "send_failed"; error?: string };
