"use client";

import { useState } from "react";
import {
  AuthAlert,
  AuthLabel,
  AUTH_BUTTON_CLASS,
  AUTH_INPUT_CLASS,
} from "@/components/admin/AuthShell";
import { NewPasswordFields } from "@/components/admin/NewPasswordFields";
import { validateNewPassword } from "@/lib/auth/password";
import { changePasswordAction } from "./actions";

export function ChangePasswordForm({ email }: { email: string }) {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    const invalid = validateNewPassword(password, confirm);
    if (invalid) {
      setError(invalid);
      return;
    }
    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set("current", current);
    formData.set("password", password);
    formData.set("confirm", confirm);
    const result = await changePasswordAction(formData);
    setSubmitting(false);

    if (result.ok) {
      setSuccess(true);
      setCurrent("");
      setPassword("");
      setConfirm("");
    } else {
      setError(result.error);
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <input type="email" name="username" value={email} autoComplete="username" readOnly hidden />
      <div>
        <AuthLabel htmlFor="current-password">現在のパスワード</AuthLabel>
        <input
          id="current-password"
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
          autoComplete="current-password"
          className={AUTH_INPUT_CLASS}
        />
      </div>
      <NewPasswordFields
        password={password}
        confirm={confirm}
        onPasswordChange={setPassword}
        onConfirmChange={setConfirm}
      />

      {error && <AuthAlert tone="danger">{error}</AuthAlert>}
      {success && <AuthAlert tone="success">パスワードを変更しました。次回から新しいパスワードでログインしてください。</AuthAlert>}

      <button type="submit" disabled={submitting} className={`mt-2 ${AUTH_BUTTON_CLASS}`}>
        {submitting ? "変更中..." : "パスワードを変更する"}
      </button>
    </form>
  );
}
