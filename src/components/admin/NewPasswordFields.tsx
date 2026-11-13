"use client";

import { useState } from "react";
import { AuthLabel, AUTH_INPUT_CLASS } from "@/components/admin/AuthShell";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/password";

// 新しいパスワード + 確認用の入力欄（再設定 / 変更で共通）
export function NewPasswordFields({
  password,
  confirm,
  onPasswordChange,
  onConfirmChange,
}: {
  password: string;
  confirm: string;
  onPasswordChange: (v: string) => void;
  onConfirmChange: (v: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const type = visible ? "text" : "password";

  return (
    <>
      <div>
        <AuthLabel htmlFor="new-password">新しいパスワード</AuthLabel>
        <input
          id="new-password"
          type={type}
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          required
          minLength={PASSWORD_MIN_LENGTH}
          autoComplete="new-password"
          aria-describedby="new-password-hint"
          className={AUTH_INPUT_CLASS}
        />
        <p id="new-password-hint" className="mt-1.5 text-admin-xs text-admin-inkMute">
          {PASSWORD_MIN_LENGTH}文字以上。英字・数字を組み合わせると安全です。
        </p>
      </div>
      <div>
        <AuthLabel htmlFor="confirm-password">新しいパスワード（確認用）</AuthLabel>
        <input
          id="confirm-password"
          type={type}
          value={confirm}
          onChange={(e) => onConfirmChange(e.target.value)}
          required
          autoComplete="new-password"
          className={AUTH_INPUT_CLASS}
        />
      </div>
      <label className="flex min-h-11 cursor-pointer items-center gap-2 text-admin-sm text-admin-inkSub">
        <input
          type="checkbox"
          checked={visible}
          onChange={(e) => setVisible(e.target.checked)}
          className="h-5 w-5"
        />
        パスワードを表示する
      </label>
    </>
  );
}
