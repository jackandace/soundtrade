"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/contexts/cart-context";
import { Container } from "./Container";

const NAV = [
  { href: "/catalog", label: "カタログ" },
  { href: "/#makers", label: "取扱メーカー" },
  { href: "/#flow", label: "ご利用の流れ" },
] as const;

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalQty, isMounted } = useCart();
  const cartCount = isMounted ? totalQty : 0;
  const close = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ivory">
      <Container>
        <div className="flex h-16 items-center justify-between md:h-20">
          <Link href="/" onClick={close} className="block">
            <div className="font-dm text-lg font-medium tracking-[0.12em] text-sumi md:text-[22px]">
              SOUND·TRADE
            </div>
            <div className="mt-0.5 hidden text-[9px] tracking-[0.3em] text-muted md:block">
              WHOLESALE INSTRUMENTS
            </div>
          </Link>

          <nav className="hidden items-center gap-10 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="border-b border-transparent py-2 text-sm tracking-wider text-sumi-light transition-all duration-300 hover:text-sumi"
              >
                {n.label}
              </Link>
            ))}
            <Link
              href="/cart"
              className="flex items-center gap-2 border border-sumi px-5 py-2.5 text-[13px] tracking-wider text-sumi"
            >
              見積カート
              <span
                className={`min-w-[18px] rounded-sm px-1.5 py-0.5 text-center text-[11px] ${
                  cartCount > 0
                    ? "bg-sumi text-white"
                    : "bg-line text-muted"
                }`}
              >
                {cartCount}
              </span>
            </Link>
          </nav>

          <div className="flex items-center gap-1 md:hidden">
            <Link
              href="/cart"
              aria-label="見積カート"
              className="relative flex h-11 w-11 items-center justify-center"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1A1A1A"
                strokeWidth="1.5"
              >
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
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1A1A1A"
                strokeWidth="1.5"
              >
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

      {menuOpen && (
        <div className="border-t border-line bg-ivory md:hidden">
          {[...NAV, { href: "/cart", label: "見積カート" }].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
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
