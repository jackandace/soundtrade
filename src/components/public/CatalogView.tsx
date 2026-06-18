"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "./ProductCard";
import { ProductRow } from "./ProductRow";

export type CatalogProduct = {
  productName: string;
  handle: string;
  maker: string | null;
  categoryL2: string | null;
  categoryL3: string | null;
  imageUrl: string | null;
  msrpInclTax: number | null;
  tags: string[];
};

type View = "list" | "tile";
const STORAGE_KEY = "sound-trade-catalog-view";

export function CatalogView({ products }: { products: CatalogProduct[] }) {
  // 初期は帯（リスト）。前回選択を localStorage から復元。
  const [view, setView] = useState<View>("list");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "tile" || saved === "list") setView(saved);
    setMounted(true);
  }, []);

  const choose = (v: View) => {
    setView(v);
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {
      // ignore
    }
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-end gap-1">
        <span className="mr-1 text-xs text-muted">表示</span>
        <ViewButton
          active={view === "list"}
          onClick={() => choose("list")}
          label="帯"
          ariaLabel="帯形式で表示"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </ViewButton>
        <ViewButton
          active={view === "tile"}
          onClick={() => choose("tile")}
          label="タイル"
          ariaLabel="タイル形式で表示"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
        </ViewButton>
      </div>

      {/* 初回描画は SSR と一致させるため list を既定でレンダ */}
      {mounted && view === "tile" ? (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 md:gap-10">
          {products.map((p) => (
            <ProductCard
              key={p.handle}
              productName={p.productName}
              handle={p.handle}
              categoryL1={p.maker ?? p.categoryL2}
              categoryL3={p.categoryL3}
              imageUrl={p.imageUrl}
              msrpInclTax={p.msrpInclTax}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {products.map((p) => (
            <ProductRow
              key={p.handle}
              productName={p.productName}
              handle={p.handle}
              maker={p.maker}
              categoryL2={p.categoryL2}
              categoryL3={p.categoryL3}
              imageUrl={p.imageUrl}
              msrpInclTax={p.msrpInclTax}
              tags={p.tags}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  ariaLabel,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={`flex h-9 items-center gap-1.5 border px-3 text-xs transition-colors ${
        active
          ? "border-sumi bg-sumi text-white"
          : "border-line-mid bg-white text-sumi-light hover:border-sumi"
      }`}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
