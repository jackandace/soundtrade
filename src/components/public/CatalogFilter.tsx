"use client";

import Link from "next/link";
import { useState } from "react";
import { CATEGORIES } from "@/lib/categories";

type Props = {
  total: number;
  countMap: Record<string, number>;
  selectedId: string | null;
};

export function CatalogFilter({ total, countMap, selectedId }: Props) {
  const [open, setOpen] = useState(false);

  const items = (
    <div className="flex flex-col gap-0.5">
      <FilterLink
        href="/catalog"
        label="すべて"
        count={total}
        active={!selectedId}
        onSelect={() => setOpen(false)}
      />
      {CATEGORIES.map((c) => (
        <FilterLink
          key={c.id}
          href={`/catalog?category=${c.id}`}
          label={c.jp}
          count={countMap[c.jp] ?? 0}
          active={selectedId === c.id}
          onSelect={() => setOpen(false)}
        />
      ))}
    </div>
  );

  return (
    <>
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full min-h-[46px] items-center justify-center gap-2 border border-line-mid bg-white px-3 py-3 text-[13px] text-sumi"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.6">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          絞り込み
          {selectedId && (
            <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-sm bg-sumi px-1 text-[10px] text-white">
              1
            </span>
          )}
        </button>
        {open && (
          <div
            role="dialog"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 flex items-end bg-black/40"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="max-h-[70vh] w-full overflow-y-auto rounded-t-lg bg-ivory px-5 pb-8 pt-6"
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="text-[15px] font-medium text-sumi">
                  カテゴリで絞り込み
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="閉じる"
                  className="flex h-11 w-11 items-center justify-center text-2xl text-muted"
                >
                  ×
                </button>
              </div>
              {items}
            </div>
          </div>
        )}
      </div>
      <aside className="hidden md:block">
        <div className="mb-4 border-b border-line pb-3 text-xs font-medium tracking-[0.08em] text-sumi">
          カテゴリ
        </div>
        {items}
      </aside>
    </>
  );
}

function FilterLink({
  href,
  label,
  count,
  active,
  onSelect,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className={`flex min-h-[44px] items-center justify-between px-3 py-3 text-sm transition-colors duration-200 ${
        active
          ? "bg-beige font-medium text-sumi"
          : "text-sumi-light hover:text-sumi"
      }`}
    >
      <span>{label}</span>
      <span className="text-[11px] text-muted">{count}</span>
    </Link>
  );
}
