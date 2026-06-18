"use client";

import { useState } from "react";
import { updateProduct } from "./actions";

const STATUS_OPTIONS: Array<[string, string]> = [
  ["active", "公開中"],
  ["draft", "下書き"],
  ["archived", "非公開"],
];

type Props = {
  id: string;
  initial: {
    productName: string;
    status: string;
    maker: string;
    categoryL1: string;
    categoryL2: string;
    categoryL3: string;
    descriptionShort: string;
    descriptionLong: string;
    tags: string;
  };
};

export function ProductEditForm({ id, initial }: Props) {
  const [productName, setProductName] = useState(initial.productName);
  const [status, setStatus] = useState(initial.status);
  const [maker, setMaker] = useState(initial.maker);
  const [categoryL1, setCategoryL1] = useState(initial.categoryL1);
  const [categoryL2, setCategoryL2] = useState(initial.categoryL2);
  const [categoryL3, setCategoryL3] = useState(initial.categoryL3);
  const [descriptionShort, setDescriptionShort] = useState(initial.descriptionShort);
  const [descriptionLong, setDescriptionLong] = useState(initial.descriptionLong);
  const [tags, setTags] = useState(initial.tags);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const r = await updateProduct({
      id,
      productName,
      status,
      maker,
      categoryL1,
      categoryL2,
      categoryL3,
      descriptionShort,
      descriptionLong,
      tags,
    });
    setSubmitting(false);
    setMessage(
      r.ok
        ? { type: "ok", text: "✓ 保存しました" }
        : { type: "err", text: r.error },
    );
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <Field label="商品名" required>
        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          required
          className={INPUT}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="ステータス" required>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={INPUT}
          >
            {STATUS_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="メーカー">
          <input
            type="text"
            value={maker}
            onChange={(e) => setMaker(e.target.value)}
            className={INPUT}
          />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field label="カテゴリ L1">
          <input
            type="text"
            value={categoryL1}
            onChange={(e) => setCategoryL1(e.target.value)}
            className={INPUT}
          />
        </Field>
        <Field label="カテゴリ L2">
          <input
            type="text"
            value={categoryL2}
            onChange={(e) => setCategoryL2(e.target.value)}
            className={INPUT}
          />
        </Field>
        <Field label="カテゴリ L3">
          <input
            type="text"
            value={categoryL3}
            onChange={(e) => setCategoryL3(e.target.value)}
            className={INPUT}
          />
        </Field>
      </div>

      <Field label="説明（短）">
        <textarea
          rows={2}
          value={descriptionShort}
          onChange={(e) => setDescriptionShort(e.target.value)}
          className={`${INPUT} resize-y`}
        />
      </Field>

      <Field label="説明（長）">
        <textarea
          rows={6}
          value={descriptionLong}
          onChange={(e) => setDescriptionLong(e.target.value)}
          className={`${INPUT} resize-y`}
        />
      </Field>

      <Field label="タグ（カンマ区切り）">
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="例: 初心者, 入門, 学校備品"
          className={INPUT}
        />
        <p className="mt-1 text-admin-xs text-admin-inkMute">
          カテゴリで分類しきれない横断的なまとめ方に使えます。公開サイトで絞り込み・検索の対象になります。
        </p>
      </Field>

      {message && (
        <p
          className={`text-admin-sm ${
            message.type === "ok" ? "text-admin-success" : "text-admin-danger"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex min-h-12 items-center justify-center rounded-md bg-admin-navy px-8 text-admin-base font-bold text-white hover:bg-admin-navyHover disabled:opacity-50"
        >
          {submitting ? "保存中..." : "保存"}
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
