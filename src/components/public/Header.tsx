"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/contexts/cart-context";
import {
  type CategoryGroup,
  catalogHrefL1,
  catalogHrefL2,
} from "@/lib/categories";
import { Container } from "./Container";

export function Header({ categoryNav }: { categoryNav: CategoryGroup[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const { totalQty, isMounted } = useCart();
  const cartCount = isMounted ? totalQty : 0;
  const closeAll = () => {
    setMenuOpen(false);
    setCatOpen(false);
  };

  const flatCats = categoryNav.flatMap((g) => g.children);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ivory">
      <Container>
        <div className="flex h-16 items-center gap-4 md:h-20 md:gap-6">
          <Link href="/" onClick={closeAll} className="block shrink-0">
            <div className="text-lg font-medium tracking-[0.08em] text-sumi md:text-[22px]">
              楽器卸のミツエス
            </div>
            <div className="mt-0.5 hidden font-dm text-[9px] tracking-[0.3em] text-muted md:block">
              MITSUESU MUSIC
            </div>
          </Link>

          {/* デスクトップ: カテゴリ + 検索 + カート */}
          <div className="relative hidden flex-1 items-center gap-3 md:flex">
            <button
              type="button"
              onClick={() => setCatOpen((v) => !v)}
              aria-expanded={catOpen}
              className="flex shrink-0 items-center gap-1.5 border border-line-mid bg-white px-4 py-2.5 text-sm text-sumi transition-colors hover:border-sumi"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              カテゴリから探す
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className={`transition-transform ${catOpen ? "rotate-180" : ""}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            <form action="/catalog" method="get" className="relative flex-1">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#888888"
                strokeWidth="1.6"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
              <input
                type="search"
                name="q"
                placeholder="商品名・メーカー・カテゴリで検索"
                aria-label="商品検索"
                className="h-11 w-full border border-line-mid bg-white pl-11 pr-4 text-sm text-sumi outline-none placeholder:text-muted focus:border-sumi"
              />
            </form>

            <Link
              href="/cart"
              className="flex shrink-0 items-center gap-2 border border-sumi px-5 py-2.5 text-[13px] tracking-wider text-sumi"
            >
              見積カート
              <span
                className={`min-w-[18px] rounded-sm px-1.5 py-0.5 text-center text-[11px] ${
                  cartCount > 0 ? "bg-sumi text-white" : "bg-line text-muted"
                }`}
              >
                {cartCount}
              </span>
            </Link>

            {/* カテゴリ・ドロップダウン（大分類→中分類・DB連動） */}
            {catOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setCatOpen(false)}
                />
                <div className="absolute left-0 top-[calc(100%+8px)] z-50 max-h-[70vh] w-[560px] overflow-auto border border-line bg-white p-4 shadow-sm">
                  {categoryNav.length === 0 ? (
                    <Link
                      href="/catalog"
                      onClick={() => setCatOpen(false)}
                      className="block px-3 py-2.5 text-sm text-sumi hover:bg-beige"
                    >
                      すべての商品を見る →
                    </Link>
                  ) : (
                    <div className="space-y-4">
                      {categoryNav.map((g) => (
                        <div key={g.name}>
                          <Link
                            href={catalogHrefL1(g.name)}
                            onClick={() => setCatOpen(false)}
                            className="mb-1.5 flex items-center gap-2 text-[13px] font-medium text-sumi transition-colors hover:text-accent"
                          >
                            {g.name}
                            <span className="font-dm text-[10px] text-muted">
                              {g.count}
                            </span>
                          </Link>
                          <div className="grid grid-cols-2 gap-0.5">
                            {g.children.map((c) => (
                              <Link
                                key={c.name}
                                href={catalogHrefL2(c.name)}
                                onClick={() => setCatOpen(false)}
                                className="flex items-center justify-between px-3 py-2 text-sm text-sumi-light transition-colors hover:bg-beige hover:text-sumi"
                              >
                                <span>{c.name}</span>
                                <span className="font-dm text-[10px] tracking-wider text-muted">
                                  {c.count}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex gap-5 border-t border-line pt-3">
                    <Link
                      href="/categories"
                      onClick={() => setCatOpen(false)}
                      className="text-sm text-accent hover:text-sumi"
                    >
                      すべてのカテゴリ →
                    </Link>
                    <Link
                      href="/catalog"
                      onClick={() => setCatOpen(false)}
                      className="text-sm text-accent hover:text-sumi"
                    >
                      すべての商品 →
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* モバイル: カート + ハンバーガー */}
          <div className="ml-auto flex items-center gap-1 md:hidden">
            <Link
              href="/cart"
              aria-label="見積カート"
              className="relative flex h-11 w-11 items-center justify-center"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.5">
                <path d="M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
                <circle cx="9" cy="20" r="1.5" />
                <circle cx="18" cy="20" r="1.5" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute right-1 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-sumi text-[10px] text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              aria-label="メニュー"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-11 w-11 items-center justify-center"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.5">
                {menuOpen ? (
                  <>
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                  </>
                ) : (
                  <>
                    <path d="M3 6h18" />
                    <path d="M3 12h18" />
                    <path d="M3 18h18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </Container>

      {/* モバイルメニュー */}
      {menuOpen && (
        <div className="border-t border-line bg-ivory md:hidden">
          <div className="border-b border-line p-4">
            <form action="/catalog" method="get" className="relative">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#888888"
                strokeWidth="1.6"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
              <input
                type="search"
                name="q"
                placeholder="商品を検索"
                aria-label="商品検索"
                className="h-12 w-full border border-line-mid bg-white pl-11 pr-4 text-sm text-sumi outline-none focus:border-sumi"
              />
            </form>
          </div>
          <div className="px-5 py-3 text-[11px] tracking-wider text-muted">
            カテゴリから探す
          </div>
          {flatCats.map((c) => (
            <Link
              key={c.name}
              href={catalogHrefL2(c.name)}
              onClick={closeAll}
              className="flex items-center justify-between border-b border-line px-5 py-3.5 text-[15px] text-sumi"
            >
              <span>
                {c.name}
                <span className="ml-2 font-dm text-[11px] text-muted">
                  {c.count}
                </span>
              </span>
              <span className="text-muted">→</span>
            </Link>
          ))}
          {[
            { href: "/categories", label: "すべてのカテゴリ" },
            { href: "/catalog", label: "すべての商品" },
            { href: "/contact", label: "掲載外商品のお問い合わせ" },
            { href: "/cart", label: "見積カート" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeAll}
              className="flex items-center justify-between border-b border-line px-5 py-4 text-[15px] text-sumi"
            >
              {item.label}
              <span className="text-muted">→</span>
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
