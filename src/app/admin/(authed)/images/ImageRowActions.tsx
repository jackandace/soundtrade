"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  replaceProductImage,
  deleteProductImage,
  setPrimaryProductImage,
} from "../products/[id]/image-actions";

export function ImageRowActions({
  imageId,
  isPrimary,
}: {
  imageId: string;
  isPrimary: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );

  const refresh = () => startTransition(() => router.refresh());

  const onPick = () => fileRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    setMsg(null);
    const fd = new FormData();
    fd.set("file", f);
    const r = await replaceProductImage(imageId, fd);
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
    if (r.ok) {
      setMsg({ type: "ok", text: "✓ 差し替えました" });
      refresh();
    } else {
      setMsg({ type: "err", text: r.error });
    }
  };

  const onDelete = async () => {
    if (!confirm("この画像を削除します。よろしいですか？")) return;
    setBusy(true);
    const r = await deleteProductImage(imageId);
    setBusy(false);
    if (r.ok) refresh();
    else alert(`削除失敗: ${r.error}`);
  };

  const onPrimary = async () => {
    setBusy(true);
    const r = await setPrimaryProductImage(imageId);
    setBusy(false);
    if (r.ok) refresh();
    else alert(`設定失敗: ${r.error}`);
  };

  return (
    <div className="flex flex-col items-start gap-1.5">
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={onFile}
        className="hidden"
      />
      <button
        type="button"
        onClick={onPick}
        disabled={busy}
        className="rounded border border-admin-line bg-admin-surface px-3 py-1.5 text-admin-xs font-medium text-admin-ink hover:bg-admin-surfaceAlt disabled:opacity-50"
      >
        {busy ? "処理中..." : "再アップ（差し替え）"}
      </button>
      <div className="flex gap-2">
        {!isPrimary && (
          <button
            type="button"
            onClick={onPrimary}
            disabled={busy}
            className="text-admin-xs text-admin-info underline-offset-2 hover:underline disabled:opacity-50"
          >
            メインに設定
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className="text-admin-xs text-admin-danger underline-offset-2 hover:underline disabled:opacity-50"
        >
          削除
        </button>
      </div>
      {msg && (
        <span
          className={`text-admin-xs ${
            msg.type === "ok" ? "text-admin-success" : "text-admin-danger"
          }`}
        >
          {msg.text}
        </span>
      )}
    </div>
  );
}
