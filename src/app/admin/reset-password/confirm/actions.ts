"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { issueRecoveryTicket } from "@/lib/auth/recovery-ticket";

// token_hash を検証して recovery セッションを Cookie に張り、新パスワード入力画面へ送る。
// GET で即検証すると、メールのリンク自動スキャン（Outlook 等）が 1 回限りのトークンを
// 先に消費してしまうため、ボタン押下（POST）で初めて検証する。
export async function verifyRecoveryToken(formData: FormData): Promise<void> {
  const tokenHash = String(formData.get("token_hash") ?? "");
  if (!tokenHash) redirect("/admin/forgot-password?error=expired");

  const supabase = createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    type: "recovery",
    token_hash: tokenHash,
  });

  const userId = data?.user?.id;
  if (error || !userId) redirect("/admin/forgot-password?error=expired");

  issueRecoveryTicket(userId);
  redirect("/admin/reset-password");
}
