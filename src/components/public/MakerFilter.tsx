"use client";

import Link from "next/link";
import { useState } from "react";

type MakerCount = { maker: string; count: number };

type Props = {
  total: number;
  makers: MakerCount[];
  selectedMaker: string | null;
  /** メーカー以外の現行クエリ（category, q, tag）を引き継ぐ */
  baseParams: Record<string, string>;
};

function buildHref(
  base: Record<string, string>,
  maker: string | null,
): string {
  const sp = new URLSearchParams(base);
  if (maker) sp.set("maker", maker);
  else sp.delete("maker");
  const s = sp.toString();
  return s ? `/catalog?${s}` : "/catalog";
}

export function MakerFilter({
  total,
  makers,
  selectedMaker,
  baseParams,
}: Props) {
  const [open, setOpen] = useState(false);
  const [brandQuery, setBrandQuery] = useState("");

  const filtered = brandQuery
    ? makers.filter((m) =>
        m.maker.toLowerCase().includes(brandQuery.toLowerCase()),
      )
    : makers;

  const list = (
    <div className="flex flex-col gap-0.5">
      <FilterLink
        href={buildHref(baseParams, null)}
        label="すべて"
        count={total}
        active={!selectedMaker}
        onSelect={() => setOpen(false)}
      />
      {filtered.map((m) => (
        <FilterLink
          key={m.maker}
          href={buildHref(baseParams, m.maker)}
          label={m.maker}
          count={m.count}
          active={selectedMaker === m.maker}
          onSelect={() => setOpen(false)}
        />
      ))}
    </div>
  );

  const brandSearch = (
    <div className="relative mb-3">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#888888"
        strokeWidth="1.6"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
      <input
        type="search"
        value={brandQuery}
        onChange={(e) => setBrandQuery(e.target.value)}
        placeholder="メーカー名で絞り込み"
        aria-label="メーカー名で絞り込み"
        className="h-10 w-full border border-line-mid bg-white pl-9 pr-3 text-[13px] text-sumi outline-none placeholder:text-muted focus:border-sumi"
      />
    </div>
  );

  return (
    <>
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-[46px] w-full items-center justify-center gap-2 border border-line-mid bg-white px-3 py-3 text-[13px] text-sumi"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.6">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          メーカーで絞り込み
          {selectedMaker && (
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
              className="max-h-[75vh] w-full overflow-y-auto rounded-t-lg bg-ivory px-5 pb-8 pt-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="text-[15px] font-medium text-sumi">
                  メーカーで絞り込み
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
              {brandSearch}
              {list}
            </div>
          </div>
        )}
      </div>
      <aside className="hidden md:block">
        <div className="mb-3 border-b border-line pb-3 text-xs font-medium tracking-[0.08em] text-sumi">
          メーカー
        </div>
        {makers.length > 6 && brandSearch}
        {list}
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
      className={`flex min-h-[40px] items-center justify-between px-3 py-2 text-sm transition-colors duration-200 ${
        active
          ? "bg-beige font-medium text-sumi"
          : "text-sumi-light hover:text-sumi"
      }`}
    >
      <span className="truncate">{label}</span>
      <span className="ml-2 shrink-0 text-[11px] text-muted">{count}</span>
    </Link>
  );
}
