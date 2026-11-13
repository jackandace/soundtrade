import { redirect } from "next/navigation";
import { AuthShell, AUTH_BUTTON_CLASS } from "@/components/admin/AuthShell";
import { verifyRecoveryToken } from "./actions";

export const dynamic = "force-dynamic";

export default function ResetPasswordConfirmPage({
  searchParams,
}: {
  searchParams: { token_hash?: string };
}) {
  const tokenHash = searchParams.token_hash;
  if (!tokenHash) redirect("/admin/forgot-password?error=expired");

  return (
    <AuthShell subtitle="パスワードの再設定">
      <form action={verifyRecoveryToken} className="grid gap-5">
        <input type="hidden" name="token_hash" value={tokenHash} />
        <p className="text-admin-sm text-admin-inkSub">
          下のボタンを押すと、新しいパスワードの入力画面に進みます。
        </p>
        <button type="submit" className={AUTH_BUTTON_CLASS}>
          新しいパスワードを設定する
        </button>
      </form>
    </AuthShell>
  );
}
