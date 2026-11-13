"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPasswordResetEmail } from "@/lib/email/password-reset";
import { writeAuthAudit } from "@/lib/auth/audit";
import { getSiteUrl } from "@/lib/seo";

export type ForgotPasswordResult = { ok: true } | { ok: false; error: string };

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

// メール内リンクの戻り先。Host ヘッダをそのまま信じると、再設定リンクを
// 攻撃者のドメインに向けさせる「パスワードリセット汚染」ができてしまうため許可リスト方式。
function resolveOrigin(): string {
  const fallback = getSiteUrl();
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return fallback;

  const allowed = new Set<string>(["soundtrade.vercel.app"]);
  // Vercel が自動で設定するこのデプロイ自身のホスト（プレビュー環境での確認用）
  for (const v of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]) {
    if (v) allowed.add(v);
  }
  try {
    const siteHost = new URL(fallback).host;
    allowed.add(siteHost);
    allowed.add(siteHost.startsWith("www.") ? siteHost.slice(4) : `www.${siteHost}`);
  } catch {
    // getSiteUrl が不正値でも fallback を返すだけ
  }
  const isLocal = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  if (isLocal && process.env.NODE_ENV !== "production") {
    return `http://${host}`;
  }
  if (allowed.has(host)) return `https://${host}`;
  return fallback;
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function requestPasswordReset(formData: FormData): Promise<ForgotPasswordResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "メールアドレスを正しく入力してください" };
  }

  // ここから先は、登録の有無・送信成否に関わらず常に ok を返す（アカウント列挙対策）。
  try {
    const admin = createAdminClient();
    const { data: row } = await admin
      .from("admin_users")
      .select("id, email, display_name, role, is_active")
      .ilike("email", escapeLike(email))
      .maybeSingle();

    if (!row || row.is_active === false) return { ok: true };

    // 同一アカウントへの連続送信を制限
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count } = await admin
      .from("audit_logs")
      .select("id", { count: "exact", head: true })
      .eq("action", "auth.password_reset_requested")
      .eq("user_id", row.id)
      .gte("created_at", since);
    if ((count ?? 0) >= RATE_LIMIT_MAX) {
      console.warn("[forgot-password] rate limited", row.id);
      return { ok: true };
    }

    const { data: link, error: linkError } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: row.email,
    });
    const tokenHash = link?.properties?.hashed_token;
    if (linkError || !tokenHash) {
      console.error("[forgot-password] generateLink failed", linkError?.message);
      return { ok: true };
    }

    const resetUrl = `${resolveOrigin()}/admin/reset-password/confirm?token_hash=${encodeURIComponent(tokenHash)}`;
    const sent = await sendPasswordResetEmail({
      to: row.email,
      displayName: row.display_name ?? row.email,
      resetUrl,
    });
    if (!sent.ok) {
      console.error("[forgot-password] email failed", sent.reason, sent.error);
    }

    await writeAuthAudit({
      action: "auth.password_reset_requested",
      user: row,
      payload: { email_sent: sent.ok, reason: sent.ok ? undefined : sent.reason },
    });
  } catch (e) {
    console.error("[forgot-password] unexpected", (e as Error).message);
  }

  return { ok: true };
}
