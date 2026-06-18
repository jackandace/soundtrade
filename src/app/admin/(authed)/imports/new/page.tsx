"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/admin/TopBar";
import { Card } from "@/components/admin/Card";
import { ImportSteps } from "@/components/admin/ImportSteps";
import { submitImport } from "./actions";

const COLUMN_GUIDE: Array<[string, string, string]> = [
  ["品番", "必須", "商品の型番（重複しない値）"],
  ["商品名", "必須", "サイトに表示される名前"],
  ["メーカー", "必須", "ブランド / メーカー名"],
  ["カテゴリ中分類", "任意", "絞り込みに使う種別（例: クラリネット）"],
  ["定価(税込)", "任意", "税込の希望小売価格（数字のみ）"],
  ["公開状態", "任意", "「公開」か「下書き」"],
  ["商品説明 / タグ", "任意", "説明文・タグ（カンマ区切り）"],
];

export default function NewImportPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const r = await submitImport(formData);
    if (r.ok) {
      router.push(`/admin/imports/${r.jobId}`);
    } else {
      setError(r.error);
      setSubmitting(false);
    }
  };

  return (
    <>
      <TopBar title="商品データの取込" />
      <div className="flex flex-col gap-5 p-8">
        <Link
          href="/admin/imports"
          className="text-admin-xs text-admin-inkMute underline-offset-2 hover:underline"
        >
          ← 取込履歴に戻る
        </Link>

        <ImportSteps current={1} />

        {/* はじめての方へ：3ステップ */}
        <Card title="かんたん3ステップ">
          <ol className="grid gap-3 md:grid-cols-3">
            {[
              ["1", "テンプレートをダウンロード", "Excelの記入用ファイルを開きます"],
              ["2", "Excelで商品を入力", "見本を消して、商品を1行ずつ入力して保存"],
              ["3", "そのままアップロード", "下の枠にファイルを入れて取込ボタン"],
            ].map(([n, t, d]) => (
              <li
                key={n}
                className="rounded-md border border-admin-line bg-admin-surfaceAlt p-4"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-admin-navy text-admin-xs font-bold text-white">
                    {n}
                  </span>
                  <span className="text-admin-sm font-bold text-admin-ink">
                    {t}
                  </span>
                </div>
                <p className="text-admin-xs text-admin-inkSub">{d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-4">
            <a
              href="/admin/imports/template"
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-admin-navy px-5 text-admin-sm font-bold text-white hover:bg-admin-navyHover"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              記入テンプレート（Excel）をダウンロード
            </a>
          </div>
        </Card>

        {/* 列の説明 */}
        <Card title="入力する項目">
          <table className="w-full">
            <thead>
              <tr className="border-b border-admin-lineLight text-left text-admin-xs text-admin-inkMute">
                <th className="py-2 font-medium">項目</th>
                <th className="py-2 font-medium">必須/任意</th>
                <th className="py-2 font-medium">説明</th>
              </tr>
            </thead>
            <tbody>
              {COLUMN_GUIDE.map(([col, req, desc]) => (
                <tr
                  key={col}
                  className="border-b border-admin-lineLight last:border-0"
                >
                  <td className="py-2 text-admin-sm font-medium text-admin-ink">
                    {col}
                  </td>
                  <td className="py-2">
                    <span
                      className={`text-admin-xs font-bold ${
                        req === "必須" ? "text-admin-danger" : "text-admin-inkMute"
                      }`}
                    >
                      {req}
                    </span>
                  </td>
                  <td className="py-2 text-admin-sm text-admin-inkSub">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-admin-xs text-admin-inkMute">
            ※ 列名が多少違っても自動で判別します（「商品名」「品名」「Title」など）。Shopify 形式のCSVもそのまま取り込めます。
          </p>
        </Card>

        {/* アップロード */}
        <Card title="ファイルをアップロード">
          <form onSubmit={onSubmit} className="grid gap-4">
            <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-admin-line bg-admin-surfaceAlt p-6 text-center hover:border-admin-navy">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6C757D" strokeWidth="1.6">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              <span className="text-admin-sm font-medium text-admin-ink">
                ここをクリックして Excel(.xlsx) または CSV を選択
              </span>
              <span className="text-admin-xs text-admin-inkMute">
                複数ファイルも可・1ファイル最大10MB
              </span>
              <input
                type="file"
                name="files"
                accept=".csv,.xlsx"
                multiple
                required
                onChange={(e) =>
                  setFileNames(
                    Array.from(e.target.files ?? []).map((f) => f.name),
                  )
                }
                className="hidden"
              />
            </label>

            {fileNames.length > 0 && (
              <ul className="grid gap-1">
                {fileNames.map((n) => (
                  <li
                    key={n}
                    className="flex items-center gap-2 text-admin-sm text-admin-ink"
                  >
                    <span className="text-admin-success">✓</span>
                    {n}
                  </li>
                ))}
              </ul>
            )}

            {error && (
              <div className="rounded border border-admin-danger/30 bg-admin-dangerBg p-3 text-admin-sm text-admin-danger">
                ⚠ {error}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Link
                href="/admin/imports"
                className="flex min-h-12 items-center rounded-md border border-admin-line bg-admin-surface px-6 text-admin-base font-medium text-admin-ink hover:bg-admin-surfaceAlt"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="flex min-h-12 items-center rounded-md bg-admin-navy px-8 text-admin-base font-bold text-white hover:bg-admin-navyHover disabled:opacity-50"
              >
                {submitting ? "読み込み中..." : "取り込んで内容をチェック"}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
