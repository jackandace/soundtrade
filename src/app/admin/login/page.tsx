"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthAlert, AuthShell } from "@/components/admin/AuthShell";
import { loginAction } from "./actions";

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthShell />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin/dashboard";
  const justReset = params.get("reset") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set("email", email);
    formData.set("password", password);

    const result = await loginAction(formData);
    if (result.ok) {
      router.replace(next);
      router.refresh();
    } else {
      setError(result.error);
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <form onSubmit={onSubmit} className="grid gap-5">
        {justReset && (
          <AuthAlert tone="success">
            パスワードを再設定しました。新しいパスワードでログインしてください。
          </AuthAlert>
        )}
        <div>
          <label className="mb-2 block text-admin-sm font-medium text-admin-ink">
            メールアドレス
            <span className="ml-2 text-admin-xs text-admin-danger">※必須</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
            className="block w-full min-h-12 rounded-md border border-admin-line bg-admin-surface px-3.5 text-admin-base text-admin-ink outline-none focus:border-admin-navy"
          />
        </div>
        <div>
          <label className="mb-2 block text-admin-sm font-medium text-admin-ink">
            パスワード
            <span className="ml-2 text-admin-xs text-admin-danger">※必須</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="block w-full min-h-12 rounded-md border border-admin-line bg-admin-surface px-3.5 text-admin-base text-admin-ink outline-none focus:border-admin-navy"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded border border-admin-danger/30 bg-admin-dangerBg px-3 py-2.5 text-admin-sm text-admin-danger">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 flex min-h-12 w-full items-center justify-center rounded-md bg-admin-navy px-6 text-admin-base font-bold tracking-wider text-white hover:bg-admin-navyHover disabled:opacity-50"
        >
          {submitting ? "ログイン中..." : "ログイン"}
        </button>
        <Link
          href="/admin/forgot-password"
          className="text-center text-admin-sm text-admin-navy underline"
        >
          パスワードをお忘れの方
        </Link>
      </form>
    </AuthShell>
  );
}
