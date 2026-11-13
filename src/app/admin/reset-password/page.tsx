import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { hasValidRecoveryTicket } from "@/lib/auth/recovery-ticket";
import { AuthShell } from "@/components/admin/AuthShell";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  // 再設定メールのリンク（confirm）で張られたセッション + 検証済みチケットが必要。
  // チケットなしの通常ログイン中なら、現在のパスワード確認つきの変更画面へ回す。
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/forgot-password?error=expired");
  if (!hasValidRecoveryTicket(admin.id)) redirect("/admin/account/password");

  return (
    <AuthShell subtitle="パスワードの再設定">
      <ResetPasswordForm email={admin.email} />
    </AuthShell>
  );
}
