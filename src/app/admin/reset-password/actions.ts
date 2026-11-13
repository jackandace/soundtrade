"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { describeUpdatePasswordError, validateNewPassword } from "@/lib/auth/password";
import { writeAuthAudit } from "@/lib/auth/audit";
import { clearRecoveryTicket, hasValidRecoveryTicket } from "@/lib/auth/recovery-ticket";

export type ResetPasswordResult = { ok: true } | { ok: false; error: string; expired?: boolean };

// 再設定メール経由（recovery セッション）で新しいパスワードを保存する
export async function resetPasswordAction(formData: FormData): Promise<ResetPasswordResult> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const invalid = validateNewPassword(password, confirm);
  if (invalid) return { ok: false, error: invalid };

  const admin = await getCurrentAdmin();
  if (!admin || !hasValidRecoveryTicket(admin.id)) {
    return {
      ok: false,
      expired: true,
      error: "再設定の有効期限が切れました。お手数ですが、もう一度申請してください",
    };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { ok: false, error: describeUpdatePasswordError(error.message) };
  }

  clearRecoveryTicket();
  await writeAuthAudit({ action: "auth.password_reset_completed", user: admin });

  // 再設定後は全端末のセッションを無効化し、新パスワードで入り直してもらう
  await supabase.auth.signOut({ scope: "global" });
  return { ok: true };
}
