import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";

// 認証系の監査ログ。
// パスワード再設定の申請は未ログイン状態で発生し、write_audit_log RPC（auth.uid() 前提）が
// 使えないため、service_role で audit_logs に直接書き込む。
export type AuthAuditAction =
  | "auth.password_reset_requested"
  | "auth.password_reset_completed"
  | "auth.password_changed";

export async function writeAuthAudit(params: {
  action: AuthAuditAction;
  user: { id: string; display_name: string | null; role: string | null };
  payload?: Record<string, unknown>;
}): Promise<void> {
  const h = headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
  const admin = createAdminClient();
  const { error } = await admin.from("audit_logs").insert({
    user_id: params.user.id,
    user_name: params.user.display_name,
    user_role: params.user.role,
    action: params.action,
    resource_type: "admin_user",
    resource_id: params.user.id,
    payload: params.payload ?? {},
    ip_address: ip,
    user_agent: h.get("user-agent"),
    risk_level: "high",
  });
  if (error) {
    // 監査ログの失敗で本処理は止めない
    console.error("[auth-audit] insert failed", params.action, error.message);
  }
}
