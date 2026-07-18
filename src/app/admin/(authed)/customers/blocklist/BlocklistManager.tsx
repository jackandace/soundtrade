"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/admin/Card";
import { blockDomain, unblockDomain } from "../[id]/actions";

type Domain = {
  id: string;
  domain: string;
  reason: string | null;
  created_at: string;
};

export function BlocklistManager({ initial }: { initial: Domain[] }) {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = await blockDomain(domain, reason);
    setBusy(false);
    if (r.ok) {
      setDomain("");
      setReason("");
      setMsg({ t: "ok", m: "✓ 追加しました" });
      router.refresh();
    } else {
      setMsg({ t: "err", m: r.error });
    }
  };

  const onRemove = async (id: string) => {
    const r = await unblockDomain(id);
    if (r.ok) router.refresh();
  };

  return (
    <div className="flex flex-col gap-5">
      <Card title="ドメインを追加">
        <form onSubmit={onAdd} className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.co.jp"
              className="h-11 min-w-[220px] flex-1 rounded-md border border-admin-line bg-admin-surface px-3 text-admin-base outline-none focus:border-admin-navy"
            />
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="理由（任意）"
              className="h-11 min-w-[160px] flex-1 rounded-md border border-admin-line bg-admin-surface px-3 text-admin-base outline-none focus:border-admin-navy"
            />
            <button
              type="submit"
              disabled={busy}
              className="flex min-h-11 items-center rounded-md bg-admin-navy px-5 text-admin-sm font-bold text-white hover:bg-admin-navyHover disabled:opacity-50"
            >
              {busy ? "追加中..." : "追加"}
            </button>
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
        </form>
      </Card>

      <Card title={`ブロック中のドメイン（${initial.length}件）`}>
        {initial.length === 0 ? (
          <p className="py-6 text-center text-admin-sm text-admin-inkSub">
            登録されたドメインはありません。
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-admin-lineLight text-left text-admin-xs text-admin-inkMute">
                <th className="py-2.5 font-medium">ドメイン</th>
                <th className="py-2.5 font-medium">理由</th>
                <th className="py-2.5 font-medium">登録日</th>
                <th className="py-2.5" />
              </tr>
            </thead>
            <tbody>
              {initial.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-admin-lineLight last:border-0"
                >
                  <td className="py-2.5 font-dm text-admin-sm text-admin-ink">
                    @{d.domain}
                  </td>
                  <td className="py-2.5 text-admin-sm text-admin-inkSub">
                    {d.reason ?? "—"}
                  </td>
                  <td className="py-2.5 text-admin-xs text-admin-inkMute">
                    {new Date(d.created_at).toLocaleDateString("ja-JP")}
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => onRemove(d.id)}
                      className="rounded border border-admin-line px-3 py-1.5 text-admin-xs text-admin-inkSub hover:bg-admin-surfaceAlt"
                    >
                      解除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
