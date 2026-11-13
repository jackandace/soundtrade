"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthAlert, AUTH_BUTTON_CLASS } from "@/components/admin/AuthShell";
import { NewPasswordFields } from "@/components/admin/NewPasswordFields";
import { validateNewPassword } from "@/lib/auth/password";
import { resetPasswordAction } from "./actions";

export function ResetPasswordForm({ email }: { email: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalid = validateNewPassword(password, confirm);
    if (invalid) {
      setError(invalid);
      return;
    }
    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set("password", password);
    formData.set("confirm", confirm);
    const result = await resetPasswordAction(formData);

    if (result.ok) {
      router.replace("/admin/login?reset=1");
      router.refresh();
      return;
    }
    if (result.expired) {
      router.replace("/admin/forgot-password?error=expired");
      return;
    }
    setError(result.error);
    setSubmitting(false);
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      {/* パスワードマネージャーが対象アカウントを認識できるようにする */}
      <input type="email" name="username" value={email} autoComplete="username" readOnly hidden />
      <p className="text-admin-sm text-admin-inkSub">
        <span className="font-medium text-admin-ink">{email}</span> の新しいパスワードを設定してください。
      </p>
      <NewPasswordFields
        password={password}
        confirm={confirm}
        onPasswordChange={setPassword}
        onConfirmChange={setConfirm}
      />

      {error && <AuthAlert tone="danger">{error}</AuthAlert>}

      <button type="submit" disabled={submitting} className={`mt-2 ${AUTH_BUTTON_CLASS}`}>
        {submitting ? "保存中..." : "パスワードを保存する"}
      </button>
    </form>
  );
}
