"use client";

import { useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/admin/TopBar";
import { Card } from "@/components/admin/Card";
import {
  importImages,
  type ImageImportResult,
  type ImageImportRowResult,
} from "./actions";

const STATUS_STYLE: Record<
  ImageImportRowResult["status"],
  { label: string; cls: string }
> = {
  ok: { label: "登録", cls: "bg-admin-successBg text-admin-success" },
  unlinked: { label: "型番なし登録", cls: "bg-admin-infoBg text-admin-info" },
  skipped: { label: "スキップ", cls: "bg-admin-neutralBg text-admin-neutral" },
  download_failed: { label: "取得失敗", cls: "bg-admin-dangerBg text-admin-danger" },
  store_failed: { label: "保存失敗", cls: "bg-admin-dangerBg text-admin-danger" },
};

export default function ImageImportPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImageImportResult | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);
    const formData = new FormData(e.currentTarget);
    const r = await importImages(formData);
    setSubmitting(false);
    if (r.ok) {
      setResult(r);
    } else {
      setError(r.error);
    }
  };

  return (
    <>
      <TopBar title="画像取込" />
      <div className="flex flex-col gap-5 p-8">
        <Link
          href="/admin/imports"
          className="text-admin-xs text-admin-inkMute underline-offset-2 hover:underline"
        >
          ← CSV取込に戻る
        </Link>

        <Card title="品番→画像URL リストから一括登録">
          <div className="mb-4 rounded-md border border-admin-info/30 bg-admin-infoBg p-4 text-admin-sm">
            <div className="mb-1 font-bold text-admin-info">使い方</div>
            <ul className="grid gap-1 text-admin-ink">
              <li>
                ・「<strong>品番</strong>」列と「<strong>画像URL</strong>」列を含む xlsx / CSV をアップロード
              </li>
              <li>
                ・品番は商品マスタの <strong>SKU（sku_base）</strong> と完全一致で照合します
              </li>
              <li>
                ・画像URLから画像を取得し、自社ストレージに保存して商品に紐付けます
              </li>
              <li>
                ・品番の商品が未登録でも、<strong>画像は「型番なし」状態で保存</strong>されます（後で商品登録時に紐付け直せます）
              </li>
            </ul>
          </div>

          <form onSubmit={onSubmit} className="grid gap-4">
            <div>
              <label className="mb-1.5 block text-admin-sm font-medium text-admin-ink">
                ファイル（.xlsx または .csv）
                <span className="ml-2 text-admin-xs text-admin-danger">※必須</span>
              </label>
              <input
                type="file"
                name="file"
                accept=".xlsx,.csv"
                required
                className="block w-full rounded-md border border-admin-line bg-admin-surface p-2.5 text-admin-sm file:mr-3 file:rounded file:border-0 file:bg-admin-surfaceAlt file:px-3 file:py-2 file:text-admin-sm file:text-admin-ink"
              />
            </div>

            <label className="flex items-center gap-2 text-admin-sm text-admin-ink">
              <input type="checkbox" name="overwrite" className="h-4 w-4" />
              既に画像がある商品も上書きする（チェックなしは既存画像があればスキップ）
            </label>

            {error && (
              <div className="rounded border border-admin-danger/30 bg-admin-dangerBg p-3 text-admin-sm text-admin-danger">
                ⚠ {error}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex min-h-12 items-center rounded-md bg-admin-navy px-8 text-admin-base font-bold text-white hover:bg-admin-navyHover disabled:opacity-50"
              >
                {submitting ? "取込中..." : "画像を一括登録"}
              </button>
            </div>
          </form>
        </Card>

        {result?.ok && (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              <Stat label="登録成功" value={result.registered} color="text-admin-success" />
              <Stat label="型番なし登録" value={result.unlinked} color="text-admin-info" />
              <Stat label="スキップ" value={result.skipped} color="text-admin-neutral" />
              <Stat label="失敗" value={result.failed} color="text-admin-danger" />
              <Stat label="合計" value={result.total} color="text-admin-ink" />
            </div>

            <Card title={`結果明細（${result.total} 行）`}>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-admin-lineLight text-left text-admin-xs text-admin-inkMute">
                    <th className="py-2 font-medium">品番</th>
                    <th className="py-2 font-medium">状態</th>
                    <th className="py-2 font-medium">詳細</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((r, i) => {
                    const s = STATUS_STYLE[r.status];
                    return (
                      <tr
                        key={i}
                        className="border-b border-admin-lineLight last:border-0"
                      >
                        <td className="py-2.5 font-dm text-admin-sm text-admin-ink">
                          {r.sku}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`inline-flex rounded px-2 py-0.5 text-admin-xs font-bold ${s.cls}`}
                          >
                            {s.label}
                          </span>
                        </td>
                        <td className="py-2.5 text-admin-xs text-admin-inkSub">
                          {r.detail ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </>
        )}
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-admin-line bg-admin-surface p-5">
      <div className="mb-2 text-admin-sm text-admin-inkSub">{label}</div>
      <div className={`font-dm text-admin-h1 font-bold ${color}`}>
        {value.toLocaleString("ja-JP")}
      </div>
    </div>
  );
}
