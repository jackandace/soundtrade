"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { rollbackToSnapshot } from "./actions";

type Props = {
  snapshotId: string;
  productCount: number;
  variantCount: number;
  specCount: number;
  createdAt: string;
};

export function RollbackButton({
  snapshotId,
  productCount,
  variantCount,
  specCount,
  createdAt,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<
    | { ok: true; restoredProducts: number; restoredVariants: number; restoredSpecs: number }
    | { ok: false; error: string }
    | null
  >(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, submitting]);

  const onExecute = async () => {
    setSubmitting(true);
    const r = await rollbackToSnapshot(snapshotId, text);
    setSubmitting(false);
    setResult(r);
    if (r.ok) {
      setTimeout(() => router.refresh(), 800);
    }
  };

  if (result?.ok) {
    return (
      <div className="rounded-md border border-admin-success/30 bg-admin-successBg p-6">
        <div className="mb-3 flex items-center gap-2 text-admin-success">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span className="text-admin-base font-bold">ロールバック完了</span>
        </div>
        <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-admin-sm text-admin-ink">
          <dt className="text-admin-inkSub">復元した商品</dt>
          <dd>{result.restoredProducts.toLocaleString("ja-JP")} 件</dd>
          <dt className="text-admin-inkSub">バリアント</dt>
          <dd>{result.restoredVariants.toLocaleString("ja-JP")} 件</dd>
          <dt className="text-admin-inkSub">スペック</dt>
          <dd>{result.restoredSpecs.toLocaleString("ja-JP")} 件</dd>
        </dl>
        <p className="mt-4 text-admin-xs text-admin-inkSub">
          ロールバック直前の状態も自動でスナップショットされています（さらにやり直したい場合はそちらから）。
        </p>
      </div>
    );
  }

  if (result && !result.ok) {
    return (
      <div className="rounded-md border border-admin-danger/30 bg-admin-dangerBg p-6">
        <div className="mb-2 flex items-center gap-2 text-admin-danger">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6M9 9l6 6" />
          </svg>
          <span className="text-admin-base font-bold">ロールバック失敗</span>
        </div>
        <p className="text-admin-sm text-admin-ink">{result.error}</p>
        <button
          type="button"
          onClick={() => {
            setResult(null);
            setText("");
          }}
          className="mt-4 text-admin-xs text-admin-info underline-offset-2 hover:underline"
        >
          再試行する
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-12 items-center justify-center rounded-md bg-admin-danger px-8 text-admin-base font-bold text-white hover:opacity-90"
      >
        ⚠ このスナップショットに戻す
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => !submitting && setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[560px] rounded-lg border border-admin-line bg-admin-surface p-6"
          >
            <div className="mb-3 flex items-center gap-2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D52941" strokeWidth="2">
                <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                <path d="M12 9v4M12 17h.01" />
              </svg>
              <h2 className="text-admin-h3 font-bold text-admin-ink">
                本当にロールバックしますか？
              </h2>
            </div>

            <div className="mb-4 rounded-md border border-admin-danger/30 bg-admin-dangerBg p-3 text-admin-sm text-admin-ink">
              <p className="mb-1 font-bold text-admin-danger">
                ⚠ 現在の products / variants / product_specs テーブル全件を消して、
                指定スナップショットの内容で上書きします
              </p>
              <p className="text-admin-xs">
                ・このスナップショットが作成された <strong>{new Date(createdAt).toLocaleString("ja-JP")}</strong> 時点の状態に戻ります<br />
                ・以降に投入された商品データはすべて消えます（実行直前の状態は自動スナップショットされます）<br />
                ・公開サイトに即座に反映されます<br />
                ・この操作は audit_logs に high リスクで記録されます
              </p>
            </div>

            <dl className="mb-4 grid grid-cols-[120px_1fr] gap-y-2 text-admin-sm">
              <dt className="text-admin-inkSub">復元される商品</dt>
              <dd className="font-medium text-admin-ink">
                {productCount.toLocaleString("ja-JP")} 件
              </dd>
              <dt className="text-admin-inkSub">バリアント</dt>
              <dd className="font-medium text-admin-ink">
                {variantCount.toLocaleString("ja-JP")} 件
              </dd>
              <dt className="text-admin-inkSub">スペック</dt>
              <dd className="font-medium text-admin-ink">
                {specCount.toLocaleString("ja-JP")} 件
              </dd>
            </dl>

            <label className="mb-1.5 block text-admin-sm font-medium text-admin-ink">
              実行するには右の文字列を半角大文字でそのまま入力してください:{" "}
              <span className="font-dm font-bold text-admin-danger">ROLLBACK</span>
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="ROLLBACK"
              autoComplete="off"
              className="mb-4 block w-full min-h-11 rounded-md border border-admin-line bg-admin-surface px-3 font-dm text-admin-base text-admin-ink outline-none focus:border-admin-danger"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="flex min-h-12 items-center rounded-md border border-admin-line bg-admin-surface px-6 text-admin-base font-medium text-admin-ink hover:bg-admin-surfaceAlt disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={onExecute}
                disabled={submitting || text !== "ROLLBACK"}
                className="flex min-h-12 items-center rounded-md bg-admin-danger px-6 text-admin-base font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "実行中..." : "ロールバックを実行"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
