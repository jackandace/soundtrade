import { requireAdmin } from "@/lib/admin-auth";
import { TopBar } from "@/components/admin/TopBar";
import { ChangePasswordForm } from "./ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const admin = await requireAdmin();

  return (
    <>
      <TopBar title="パスワード変更" />
      <div className="flex flex-col gap-5 p-8">
        <p className="text-admin-sm text-admin-inkSub">
          ログイン中のアカウント（{admin.email}）のパスワードを変更します。変更後、他の端末でのログインは解除されます。
        </p>
        <div className="max-w-[480px] rounded-lg border border-admin-line bg-admin-surface p-6 md:p-8">
          <ChangePasswordForm email={admin.email} />
        </div>
      </div>
    </>
  );
}
