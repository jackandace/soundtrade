"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { revalidateImportJob } from "./actions";

export function RevalidateButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const onClick = async () => {
    setBusy(true);
    setMessage(null);
    const r = await revalidateImportJob(jobId);
    setBusy(false);
    if (r.ok) {
      setMessage({
        type: "ok",
        text: `✓ 再検証完了: ${r.total} 行 / エラー ${r.errors} / 警告 ${r.warnings}`,
      });
      startTransition(() => router.refresh());
    } else {
      setMessage({ type: "err", text: r.error });
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onClick}
        disabled={busy || pending}
        className="flex min-h-11 items-center rounded-md border border-admin-line bg-admin-surface px-5 text-admin-sm font-medium text-admin-ink hover:bg-admin-surfaceAlt disabled:opacity-50"
      >
        {busy || pending ? "検証中..." : "🔄 再検証"}
      </button>
      {message && (
        <span
          className={`text-admin-xs ${
            message.type === "ok" ? "text-admin-success" : "text-admin-danger"
          }`}
        >
          {message.text}
        </span>
      )}
    </div>
  );
}
