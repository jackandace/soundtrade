"use client";

import { useState } from "react";
import { Card } from "@/components/admin/Card";
import { updateInquiry } from "./actions";

const STATUS_OPTIONS: Array<[string, string]> = [
  ["new", "未対応"],
  ["in_progress", "対応中"],
  ["quoted", "見積済"],
  ["completed", "完了"],
  ["cancelled", "キャンセル"],
  ["archived", "アーカイブ"],
];

type Props = {
  id: string;
  initialStatus: string;
  initialInternalNotes: string;
  initialQuotedAmount: string;
  quotedAt: string | null;
  updatedAt: string;
};

export function InquiryEditForm({
  id,
  initialStatus,
  initialInternalNotes,
  initialQuotedAmount,
  quotedAt,
  updatedAt,
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [internalNotes, setInternalNotes] = useState(initialInternalNotes);
  const [quotedAmount, setQuotedAmount] = useState(initialQuotedAmount);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const r = await updateInquiry({ id, status, internalNotes, quotedAmount });
    setSubmitting(false);
    if (r.ok) {
      setMessage({ type: "ok", text: "✓ 保存しました" });
    } else {
      setMessage({ type: "err", text: r.error });
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Card title="ステータス / 回答">
        <div className="grid gap-4">
          <div>
            <label className="mb-1.5 block text-admin-sm font-medium text-admin-ink">
              ステータス
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="block w-full min-h-11 rounded-md border border-admin-line bg-admin-surface px-3 text-admin-base outline-none focus:border-admin-navy"
            >
              {STATUS_OPTIONS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-admin-sm font-medium text-admin-ink">
              回答見積金額（税抜・任意）
            </label>
            <div className="flex items-center gap-2">
              <span className="text-admin-sm text-admin-inkSub">¥</span>
              <input
                type="text"
                inputMode="numeric"
                value={quotedAmount}
                onChange={(e) => setQuotedAmount(e.target.value)}
                placeholder="未入力なら設定なし"
                className="block w-full min-h-11 rounded-md border border-admin-line bg-admin-surface px-3 text-admin-base outline-none focus:border-admin-navy"
              />
            </div>
            {quotedAt && (
              <p className="mt-1 text-admin-xs text-admin-inkMute">
                最終回答日時: {new Date(quotedAt).toLocaleString("ja-JP")}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-admin-sm font-medium text-admin-ink">
              社内メモ（顧客には公開されません）
            </label>
            <textarea
              rows={5}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              className="block w-full resize-y rounded-md border border-admin-line bg-admin-surface p-3 text-admin-sm outline-none focus:border-admin-navy"
            />
          </div>

          {message && (
            <p
              className={`text-admin-sm ${
                message.type === "ok" ? "text-admin-success" : "text-admin-danger"
              }`}
            >
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex min-h-12 w-full items-center justify-center rounded-md bg-admin-navy text-admin-base font-bold text-white hover:bg-admin-navyHover disabled:opacity-50"
          >
            {submitting ? "保存中..." : "保存"}
          </button>

          <p className="text-center text-admin-xs text-admin-inkMute">
            最終更新: {new Date(updatedAt).toLocaleString("ja-JP")}
          </p>
        </div>
      </Card>
    </form>
  );
}
