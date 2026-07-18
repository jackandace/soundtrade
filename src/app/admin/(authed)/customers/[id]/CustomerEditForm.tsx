"use client";

import { useState } from "react";
import { Card } from "@/components/admin/Card";
import { updateCustomer, blockDomain } from "./actions";

type Props = {
  id: string;
  email: string;
  initialIsBlocked: boolean;
  initialBlockedReason: string;
  initialNotes: string;
};

export function CustomerEditForm({
  id,
  email,
  initialIsBlocked,
  initialBlockedReason,
  initialNotes,
}: Props) {
  const [isBlocked, setIsBlocked] = useState(initialIsBlocked);
  const [blockedReason, setBlockedReason] = useState(initialBlockedReason);
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);

  const domain = email.includes("@") ? email.split("@")[1] : "";
  const [domMsg, setDomMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);
  const [domBusy, setDomBusy] = useState(false);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const r = await updateCustomer({ id, isBlocked, blockedReason, notes });
    setSaving(false);
    setMsg(r.ok ? { t: "ok", m: "✓ 保存しました" } : { t: "err", m: r.error });
  };

  const onBlockDomain = async () => {
    if (!domain) return;
    setDomBusy(true);
    setDomMsg(null);
    const r = await blockDomain(domain, blockedReason);
    setDomBusy(false);
    setDomMsg(
      r.ok
        ? { t: "ok", m: `✓ ${domain} をドメインごとブロックしました` }
        : { t: "err", m: r.error },
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={onSave}>
        <Card title="ブロック / 社内メモ">
          <div className="grid gap-4">
            <label className="flex items-start gap-2.5">
              <input
                type="checkbox"
                checked={isBlocked}
                onChange={(e) => setIsBlocked(e.target.checked)}
                className="mt-0.5 h-5 w-5"
              />
              <span>
                <span className="block text-admin-sm font-medium text-admin-ink">
                  この顧客をブロックする
                </span>
                <span className="block text-admin-xs text-admin-inkMute">
                  以後の依頼は自動でアーカイブされ、管理者への通知メールも送られません。
                </span>
              </span>
            </label>

            <div>
              <label className="mb-1.5 block text-admin-sm font-medium text-admin-ink">
                ブロック理由（任意・社内用）
              </label>
              <input
                type="text"
                value={blockedReason}
                onChange={(e) => setBlockedReason(e.target.value)}
                placeholder="例: 営業メール"
                className="block w-full min-h-11 rounded-md border border-admin-line bg-admin-surface px-3 text-admin-base outline-none focus:border-admin-navy"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-admin-sm font-medium text-admin-ink">
                社内メモ（顧客には非公開）
              </label>
              <textarea
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="block w-full resize-y rounded-md border border-admin-line bg-admin-surface p-3 text-admin-sm outline-none focus:border-admin-navy"
              />
            </div>

            {msg && (
              <p
                className={`text-admin-sm ${
                  msg.t === "ok" ? "text-admin-success" : "text-admin-danger"
                }`}
              >
                {msg.m}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex min-h-12 w-full items-center justify-center rounded-md bg-admin-navy text-admin-base font-bold text-white hover:bg-admin-navyHover disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </Card>
      </form>

      {domain && (
        <Card title="ドメインごとブロック">
          <div className="grid gap-3">
            <p className="text-admin-xs leading-relaxed text-admin-inkSub">
              同じ会社ドメイン（
              <span className="font-medium text-admin-ink">@{domain}</span>
              ）からの依頼をまとめてブロックします。営業が複数アドレスから来る場合に有効です。
            </p>
            {domMsg && (
              <p
                className={`text-admin-sm ${
                  domMsg.t === "ok" ? "text-admin-success" : "text-admin-danger"
                }`}
              >
                {domMsg.m}
              </p>
            )}
            <button
              type="button"
              onClick={onBlockDomain}
              disabled={domBusy}
              className="flex min-h-11 items-center justify-center rounded-md border border-admin-danger px-4 text-admin-sm font-medium text-admin-danger hover:bg-admin-danger/5 disabled:opacity-50"
            >
              {domBusy ? "処理中..." : `@${domain} をブロック`}
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
