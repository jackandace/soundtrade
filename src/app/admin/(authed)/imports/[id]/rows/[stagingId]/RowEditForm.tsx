"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveStagingRow } from "./actions";

const STATUS_OPTIONS: Array<[string, string]> = [
  ["active", "公開中"],
  ["draft", "下書き"],
  ["archived", "非公開"],
];

type Props = {
  jobId: string;
  stagingId: string;
  initial: {
    handle: string;
    product_name: string;
    maker: string;
    category_l1: string;
    category_l2: string;
    category_l3: string;
    msrp_incl_tax: string;
    status: string;
    description_short: string;
  };
};

export function RowEditForm({ jobId, stagingId, initial }: Props) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const r = await saveStagingRow({
      jobId,
      stagingId,
      ...v,
    });
    if (r.ok) {
      router.push(`/admin/imports/${jobId}`);
    } else {
      setError(r.error);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <Field label="Handle" required>
        <input
          type="text"
          value={v.handle}
          onChange={(e) => setV({ ...v, handle: e.target.value })}
          required
          className={INPUT}
        />
      </Field>
      <Field label="商品名 (Title)" required>
        <input
          type="text"
          value={v.product_name}
          onChange={(e) => setV({ ...v, product_name: e.target.value })}
          required
          className={INPUT}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="メーカー (Vendor)" required>
          <input
            type="text"
            value={v.maker}
            onChange={(e) => setV({ ...v, maker: e.target.value })}
            required
            className={INPUT}
          />
        </Field>
        <Field label="ステータス" required>
          <select
            value={v.status}
            onChange={(e) => setV({ ...v, status: e.target.value })}
            className={INPUT}
          >
            {STATUS_OPTIONS.map(([val, l]) => (
              <option key={val} value={val}>
                {l}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="希望小売価格 (税込・空欄可)">
        <div className="flex items-center gap-2">
          <span className="text-admin-sm text-admin-inkSub">¥</span>
          <input
            type="text"
            inputMode="numeric"
            value={v.msrp_incl_tax}
            onChange={(e) => setV({ ...v, msrp_incl_tax: e.target.value })}
            placeholder="未入力で 0 扱い（active なら警告）"
            className={INPUT}
          />
        </div>
      </Field>
      <div className="grid grid-cols-3 gap-4">
        <Field label="カテゴリ L1">
          <input
            type="text"
            value={v.category_l1}
            onChange={(e) => setV({ ...v, category_l1: e.target.value })}
            className={INPUT}
          />
        </Field>
        <Field label="カテゴリ L2">
          <input
            type="text"
            value={v.category_l2}
            onChange={(e) => setV({ ...v, category_l2: e.target.value })}
            className={INPUT}
          />
        </Field>
        <Field label="カテゴリ L3">
          <input
            type="text"
            value={v.category_l3}
            onChange={(e) => setV({ ...v, category_l3: e.target.value })}
            className={INPUT}
          />
        </Field>
      </div>
      <Field label="説明（短）">
        <textarea
          rows={3}
          value={v.description_short}
          onChange={(e) => setV({ ...v, description_short: e.target.value })}
          className={`${INPUT} resize-y`}
        />
      </Field>

      {error && (
        <div className="rounded border border-admin-danger/30 bg-admin-dangerBg p-3 text-admin-sm text-admin-danger">
          ⚠ {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.push(`/admin/imports/${jobId}`)}
          className="flex min-h-12 items-center rounded-md border border-admin-line bg-admin-surface px-6 text-admin-base font-medium text-admin-ink hover:bg-admin-surfaceAlt"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex min-h-12 items-center rounded-md bg-admin-navy px-8 text-admin-base font-bold text-white hover:bg-admin-navyHover disabled:opacity-50"
        >
          {submitting ? "保存中..." : "保存して再検証"}
        </button>
      </div>
    </form>
  );
}

const INPUT =
  "block w-full min-h-11 rounded-md border border-admin-line bg-admin-surface px-3 text-admin-base text-admin-ink outline-none focus:border-admin-navy";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-admin-sm font-medium text-admin-ink">
        {label}
        {required && (
          <span className="ml-2 text-admin-xs text-admin-danger">※必須</span>
        )}
      </label>
      {children}
    </div>
  );
}
