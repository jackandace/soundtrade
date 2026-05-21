"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAction } from "./actions";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin/dashboard";

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
    <div className="flex min-h-screen items-center justify-center bg-admin-bg px-5 py-12">
      <div className="w-full max-w-[420px] rounded-lg border border-admin-line bg-admin-surface p-8 md:p-10">
        <div className="mb-8 text-center">
          <div className="font-dm text-xl font-bold tracking-[0.12em] text-admin-ink">
            SOUND·TRADE
          </div>
          <div className="mt-1 text-admin-xs text-admin-inkMute">管理画面</div>
        </div>

        <form onSubmit={onSubmit} className="grid gap-5">
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
        </form>
      </div>
    </div>
  );
}
