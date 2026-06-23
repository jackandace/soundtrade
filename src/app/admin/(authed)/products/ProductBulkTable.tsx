"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { parseTags } from "@/lib/tags";
import { bulkAddTag, bulkRemoveTag, bulkSetStatus } from "./bulk-actions";

type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral";
const PRODUCT_STATUS: Record<string, { label: string; variant: StatusVariant }> = {
  active: { label: "公開中", variant: "success" },
  draft: { label: "下書き", variant: "neutral" },
  archived: { label: "非公開", variant: "danger" },
};

export type ProductRowData = {
  id: string;
  handle: string;
  product_name: string;
  category_l2: string | null;
  maker: string | null;
  status: string;
  tags: string | null;
  updated_at: string;
};

export function ProductBulkTable({
  rows,
  registeredTags,
}: {
  rows: ProductRowData[];
  registeredTags: string[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tag, setTag] = useState("");
  const [freeTag, setFreeTag] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const allChecked = rows.length > 0 && selected.size === rows.length;
  const someChecked = selected.size > 0;

  const toggleAll = () => {
    setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)));
  };
  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const effectiveTag = (freeTag.trim() || tag).trim();

  const runStatus = async (status: "active" | "draft" | "archived") => {
    const label = PRODUCT_STATUS[status].label;
    if (!confirm(`選択中の ${selected.size} 商品を「${label}」に変更します。よろしいですか？`))
      return;
    setBusy(true);
    setMsg(null);
    const r = await bulkSetStatus(Array.from(selected), status);
    setBusy(false);
    if (r.ok) {
      setMsg({ type: "ok", text: `✓ ${r.affected} 商品を「${label}」にしました` });
      setSelected(new Set());
      startTransition(() => router.refresh());
    } else {
      setMsg({ type: "err", text: r.error });
    }
  };

  const run = async (mode: "add" | "remove") => {
    if (!effectiveTag) {
      setMsg({ type: "err", text: "タグを選ぶか入力してください" });
      return;
    }
    setBusy(true);
    setMsg(null);
    const ids = Array.from(selected);
    const r =
      mode === "add"
        ? await bulkAddTag(ids, effectiveTag)
        : await bulkRemoveTag(ids, effectiveTag);
    setBusy(false);
    if (r.ok) {
      setMsg({
        type: "ok",
        text: `✓ ${r.affected} 商品に「${effectiveTag}」を${mode === "add" ? "追加" : "削除"}しました`,
      });
      setSelected(new Set());
      setFreeTag("");
      startTransition(() => router.refresh());
    } else {
      setMsg({ type: "err", text: r.error });
    }
  };

  return (
    <div>
      {/* 一括操作バー */}
      <div className="mb-4 grid gap-2 rounded-md border border-admin-line bg-admin-surfaceAlt p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="min-w-[72px] text-admin-sm font-medium text-admin-ink">
            選択 {selected.size} 件
          </span>
          <span className="text-admin-xs text-admin-inkSub">公開状態:</span>
          <button
            type="button"
            onClick={() => runStatus("active")}
            disabled={busy || !someChecked}
            className="flex min-h-9 items-center rounded-md bg-admin-success px-3 text-admin-sm font-bold text-white hover:opacity-90 disabled:opacity-40"
          >
            公開にする
          </button>
          <button
            type="button"
            onClick={() => runStatus("draft")}
            disabled={busy || !someChecked}
            className="flex min-h-9 items-center rounded-md border border-admin-line bg-admin-surface px-3 text-admin-sm font-medium text-admin-ink hover:bg-admin-surfaceAlt disabled:opacity-40"
          >
            下書きにする
          </button>
          <button
            type="button"
            onClick={() => runStatus("archived")}
            disabled={busy || !someChecked}
            className="flex min-h-9 items-center rounded-md border border-admin-line bg-admin-surface px-3 text-admin-sm font-medium text-admin-ink hover:bg-admin-surfaceAlt disabled:opacity-40"
          >
            非公開にする
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="min-w-[72px] text-admin-xs text-admin-inkSub">タグ:</span>
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="min-h-9 rounded-md border border-admin-line bg-admin-surface px-3 text-admin-sm outline-none focus:border-admin-navy"
          >
            <option value="">登録タグから選ぶ…</option>
            {registeredTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <span className="text-admin-xs text-admin-inkMute">または</span>
          <input
            type="text"
            value={freeTag}
            onChange={(e) => setFreeTag(e.target.value)}
            placeholder="タグを直接入力"
            className="min-h-9 w-36 rounded-md border border-admin-line bg-admin-surface px-3 text-admin-sm outline-none focus:border-admin-navy"
          />
          <button
            type="button"
            onClick={() => run("add")}
            disabled={busy || !someChecked}
            className="flex min-h-9 items-center rounded-md bg-admin-navy px-3 text-admin-sm font-bold text-white hover:bg-admin-navyHover disabled:opacity-40"
          >
            タグ追加
          </button>
          <button
            type="button"
            onClick={() => run("remove")}
            disabled={busy || !someChecked}
            className="flex min-h-9 items-center rounded-md border border-admin-line bg-admin-surface px-3 text-admin-sm font-medium text-admin-ink hover:bg-admin-surfaceAlt disabled:opacity-40"
          >
            タグ削除
          </button>
        </div>
        {msg && (
          <div
            className={`text-admin-sm ${
              msg.type === "ok" ? "text-admin-success" : "text-admin-danger"
            }`}
          >
            {msg.text}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="border-b border-admin-lineLight text-left text-admin-xs text-admin-inkMute">
              <th className="py-3 pr-2">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  aria-label="全選択"
                  className="h-4 w-4"
                />
              </th>
              <th className="py-3 font-medium">商品名</th>
              <th className="py-3 font-medium">メーカー / カテゴリ</th>
              <th className="py-3 font-medium">タグ</th>
              <th className="py-3 font-medium">状態</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const st = PRODUCT_STATUS[r.status] ?? PRODUCT_STATUS.draft;
              const tags = parseTags(r.tags);
              const checked = selected.has(r.id);
              return (
                <tr
                  key={r.id}
                  className={`border-b border-admin-lineLight last:border-0 ${
                    checked ? "bg-admin-infoBg/40" : "hover:bg-admin-surfaceAlt"
                  }`}
                >
                  <td className="py-3 pr-2 align-top">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(r.id)}
                      aria-label={`${r.product_name} を選択`}
                      className="h-4 w-4"
                    />
                  </td>
                  <td className="py-3 align-top text-admin-sm">
                    <Link
                      href={`/admin/products/${r.id}`}
                      className="text-admin-ink underline-offset-2 hover:underline"
                    >
                      {r.product_name}
                    </Link>
                    <div className="font-dm text-admin-xs text-admin-inkMute">
                      {r.handle}
                    </div>
                  </td>
                  <td className="py-3 align-top text-admin-sm text-admin-inkSub">
                    {r.maker ?? "—"}
                    {r.category_l2 ? ` / ${r.category_l2}` : ""}
                  </td>
                  <td className="py-3 align-top">
                    {tags.length === 0 ? (
                      <span className="text-admin-xs text-admin-inkMute">—</span>
                    ) : (
                      <div className="flex max-w-[280px] flex-wrap gap-1">
                        {tags.map((t) => (
                          <span
                            key={t}
                            className="rounded bg-admin-bg px-1.5 py-0.5 text-admin-xs text-admin-inkSub"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-3 align-top">
                    <StatusBadge variant={st.variant}>{st.label}</StatusBadge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
