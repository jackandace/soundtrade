"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/admin/TopBar";
import { Card } from "@/components/admin/Card";
import { submitImport } from "./actions";

type Pattern = "shopify" | "split";

export default function NewImportPage() {
  const router = useRouter();
  const [pattern, setPattern] = useState<Pattern>("shopify");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("pattern", pattern);
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
      <TopBar title="CSV取込 / 新規ジョブ" />
      <div className="flex flex-col gap-5 p-8">
        <Link
          href="/admin/imports"
          className="text-admin-xs text-admin-inkMute underline-offset-2 hover:underline"
        >
          ← ジョブ一覧に戻る
        </Link>

        <Card title="CSV アップロード">
          <form onSubmit={onSubmit} className="grid gap-5">
            <div>
              <div className="mb-2 text-admin-sm font-medium text-admin-ink">
                ファイル形式
              </div>
              <div className="flex gap-1 rounded-md border border-admin-line p-1">
                {(
                  [
                    ["shopify", "Pattern A: Shopify 1ファイル", "shopify_*.csv"],
                    ["split", "Pattern B: 分割ファイル", "products / variants / specs"],
                  ] as const
                ).map(([id, label, sub]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPattern(id)}
                    className={`flex-1 rounded px-4 py-3 text-left transition-colors ${
                      pattern === id
                        ? "bg-admin-navy text-white"
                        : "text-admin-inkSub hover:bg-admin-surfaceAlt"
                    }`}
                  >
                    <div className="text-admin-sm font-medium">{label}</div>
                    <div
                      className={`text-admin-xs ${
                        pattern === id ? "text-white/70" : "text-admin-inkMute"
                      }`}
                    >
                      {sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {pattern === "shopify" ? (
              <FileField
                label="shopify_*.csv"
                name="shopify"
                required
              />
            ) : (
              <>
                <FileField
                  label="products_*.csv"
                  name="products"
                  required
                  hint="商品マスタ。Pattern B では必須"
                />
                <FileField
                  label="variants_*.csv"
                  name="variants"
                  hint="バリアント別データ（任意）"
                />
                <FileField
                  label="product_specs_*.csv"
                  name="specs"
                  hint="縦持ちスペック（任意）"
                />
              </>
            )}

            <p className="text-admin-xs text-admin-inkMute">
              ※ BOM 付き UTF-8、1 ファイルあたり最大 10MB
            </p>

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
                {submitting ? "検証中..." : "アップロードして検証"}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}

function FileField({
  label,
  name,
  required,
  hint,
}: {
  label: string;
  name: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-admin-sm font-medium text-admin-ink">
        {label}
        {required && (
          <span className="ml-2 text-admin-xs text-admin-danger">※必須</span>
        )}
      </label>
      <input
        type="file"
        name={name}
        accept=".csv"
        required={required}
        className="block w-full rounded-md border border-admin-line bg-admin-surface p-3 text-admin-sm file:mr-3 file:rounded file:border-0 file:bg-admin-surfaceAlt file:px-3 file:py-2 file:text-admin-sm file:text-admin-ink hover:file:bg-admin-bg"
      />
      {hint && (
        <p className="mt-1 text-admin-xs text-admin-inkMute">{hint}</p>
      )}
    </div>
  );
}
