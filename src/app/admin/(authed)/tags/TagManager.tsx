"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/admin/Card";
import { createTag, renameTag, deleteTag } from "./actions";

type TagInfo = { name: string; count: number };

export function TagManager({
  registered,
  unregistered,
}: {
  registered: TagInfo[];
  unregistered: TagInfo[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [newTag, setNewTag] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const refresh = () => startTransition(() => router.refresh());

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = await createTag(newTag);
    setBusy(false);
    if (r.ok) {
      setNewTag("");
      setMsg({ type: "ok", text: "✓ タグを登録しました" });
      refresh();
    } else {
      setMsg({ type: "err", text: r.error });
    }
  };

  const onRegisterExisting = async (name: string) => {
    setBusy(true);
    const r = await createTag(name);
    setBusy(false);
    if (r.ok) refresh();
    else alert(r.error);
  };

  const onRename = async (oldName: string) => {
    const next = prompt(`「${oldName}」を新しいタグ名に変更します`, oldName);
    if (next === null) return;
    if (!next.trim()) return;
    setBusy(true);
    const r = await renameTag(oldName, next);
    setBusy(false);
    if (r.ok) refresh();
    else alert(r.error);
  };

  const onDelete = async (name: string, count: number) => {
    let strip = false;
    if (count > 0) {
      const ans = confirm(
        `「${name}」は ${count} 商品に付いています。\n\nOK: 商品からも外して削除\nキャンセル: 削除しない`,
      );
      if (!ans) return;
      strip = true;
    } else {
      if (!confirm(`「${name}」を削除しますか？`)) return;
    }
    setBusy(true);
    const r = await deleteTag(name, strip);
    setBusy(false);
    if (r.ok) refresh();
    else alert(r.error);
  };

  return (
    <div className="grid gap-5">
      <Card title="新しいタグを登録">
        <form onSubmit={onCreate} className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <label className="mb-1.5 block text-admin-sm font-medium text-admin-ink">
              タグ名
            </label>
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="例: 初心者"
              className="block w-full min-h-11 rounded-md border border-admin-line bg-admin-surface px-3 text-admin-base outline-none focus:border-admin-navy md:max-w-xs"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="flex min-h-11 items-center rounded-md bg-admin-navy px-6 text-admin-sm font-bold text-white hover:bg-admin-navyHover disabled:opacity-50"
          >
            登録
          </button>
          {msg && (
            <span
              className={`text-admin-sm ${
                msg.type === "ok" ? "text-admin-success" : "text-admin-danger"
              }`}
            >
              {msg.text}
            </span>
          )}
        </form>
      </Card>

      <Card title={`登録済みタグ（${registered.length}）`}>
        {registered.length === 0 ? (
          <p className="py-6 text-center text-admin-sm text-admin-inkSub">
            まだ登録タグがありません。
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-admin-lineLight text-left text-admin-xs text-admin-inkMute">
                <th className="py-2 font-medium">タグ</th>
                <th className="py-2 font-medium">使用商品数</th>
                <th className="py-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {registered.map((t) => (
                <tr
                  key={t.name}
                  className="border-b border-admin-lineLight last:border-0"
                >
                  <td className="py-2.5 text-admin-sm font-medium text-admin-ink">
                    {t.name}
                  </td>
                  <td className="py-2.5 font-dm text-admin-sm text-admin-inkSub">
                    {t.count}
                  </td>
                  <td className="py-2.5">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => onRename(t.name)}
                        disabled={busy}
                        className="text-admin-xs text-admin-info underline-offset-2 hover:underline disabled:opacity-50"
                      >
                        名称変更
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(t.name, t.count)}
                        disabled={busy}
                        className="text-admin-xs text-admin-danger underline-offset-2 hover:underline disabled:opacity-50"
                      >
                        削除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {unregistered.length > 0 && (
        <Card title={`商品で使用中・未登録のタグ（${unregistered.length}）`}>
          <p className="mb-3 text-admin-xs text-admin-inkMute">
            商品に付いているがタグ管理に未登録のタグです。登録すると一括付与の候補に出ます。
          </p>
          <div className="flex flex-wrap gap-2">
            {unregistered.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => onRegisterExisting(t.name)}
                disabled={busy}
                className="flex items-center gap-1.5 rounded border border-admin-line bg-admin-surfaceAlt px-2.5 py-1.5 text-admin-xs text-admin-ink hover:bg-admin-bg disabled:opacity-50"
                title="クリックで登録"
              >
                <span>{t.name}</span>
                <span className="text-admin-inkMute">({t.count})</span>
                <span className="text-admin-info">＋登録</span>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
