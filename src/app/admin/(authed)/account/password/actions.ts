"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { describeUpdatePasswordError, validateNewPassword } from "@/lib/auth/password";
import { writeAuthAudit } from "@/lib/auth/audit";

export type ChangePasswordResult = { ok: true } | { ok: false; error: string };

// 現在のパスワードが正しいかを、Cookie に触れない使い捨てクライアントで確認する
async function verifyCurrentPassword(email: string, password: string): Promise<boolean> {
  const probe = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { data, error } = await probe.auth.signInWithPassword({ email, password });
  if (error || !data.session) return false;
  // 確認用に作られたセッションだけを破棄（利用中のセッションには影響しない）
  await probe.auth.signOut({ scope: "local" });
  return true;
}

export async function changePasswordAction(formData: FormData): Promise<ChangePasswordResult> {
  const admin = await requireAdmin();
  const current = String(formData.get("current") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!current) return { ok: false, error: "現在のパスワードを入力してください" };
  const invalid = validateNewPassword(password, confirm);
  if (invalid) return { ok: false, error: invalid };
  if (current === password) {
    return { ok: false, error: "現在と同じパスワードは設定できません。別のパスワードを入力してください" };
  }

  if (!(await verifyCurrentPassword(admin.email, current))) {
    return { ok: false, error: "現在のパスワードが正しくありません" };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { ok: false, error: describeUpdatePasswordError(error.message) };
  }

  await writeAuthAudit({ action: "auth.password_changed", user: admin });

  // 他の端末に残っているログインは無効化（この端末はそのまま使える）
  await supabase.auth.signOut({ scope: "others" });
  return { ok: true };
}
