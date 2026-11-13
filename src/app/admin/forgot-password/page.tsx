"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AuthAlert,
  AuthLabel,
  AuthShell,
  AUTH_BUTTON_CLASS,
  AUTH_INPUT_CLASS,
} from "@/components/admin/AuthShell";
import { requestPasswordReset } from "./actions";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<AuthShell subtitle="パスワードの再設定" />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}

function ForgotPasswordForm() {
  const params = useSearchParams();
  const expired = params.get("error") === "expired";

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const formData = new FormData();
    formData.set("email", email);
    const result = await requestPasswordReset(formData);
    setSubmitting(false);
    if (result.ok) {
      setDone(true);
    } else {
      setError(result.error);
    }
  };

  if (done) {
    return (
      <AuthShell subtitle="パスワードの再設定">
        <div className="grid gap-5">
          <AuthAlert tone="success">
            ご入力のメールアドレスが管理画面に登録されている場合、パスワード再設定のメールを送信しました。
          </AuthAlert>
          <ul className="list-disc space-y-1 pl-5 text-admin-sm text-admin-inkSub">
            <li>メール内のリンクの有効期限は 1 時間です。</li>
            <li>数分たっても届かない場合は、迷惑メールフォルダもご確認ください。</li>
            <li>それでも届かない場合は、運営担当までご連絡ください。</li>
          </ul>
          <Link href="/admin/login" className="text-center text-admin-sm text-admin-navy underline">
            ログイン画面に戻る
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell subtitle="パスワードの再設定">
      <form onSubmit={onSubmit} className="grid gap-5">
        {expired && (
          <AuthAlert tone="danger">
            再設定リンクの有効期限が切れているか、すでに使用済みです。お手数ですが、もう一度申請してください。
          </AuthAlert>
        )}
        <p className="text-admin-sm text-admin-inkSub">
          管理画面に登録しているメールアドレスを入力してください。パスワード再設定用のリンクをお送りします。
        </p>
        <div>
          <AuthLabel htmlFor="email">メールアドレス</AuthLabel>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
            className={AUTH_INPUT_CLASS}
          />
        </div>

        {error && <AuthAlert tone="danger">{error}</AuthAlert>}

        <button type="submit" disabled={submitting} className={`mt-2 ${AUTH_BUTTON_CLASS}`}>
          {submitting ? "送信中..." : "再設定メールを送る"}
        </button>
        <Link href="/admin/login" className="text-center text-admin-sm text-admin-navy underline">
          ログイン画面に戻る
        </Link>
      </form>
    </AuthShell>
  );
}
