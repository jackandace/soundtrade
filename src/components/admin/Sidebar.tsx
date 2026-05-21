"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV: Array<{ href: string; label: string; icon: ReactNode }> = [
  {
    href: "/admin/dashboard",
    label: "ダッシュボード",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="8" height="9" />
        <rect x="13" y="3" width="8" height="5" />
        <rect x="13" y="10" width="8" height="11" />
        <rect x="3" y="14" width="8" height="7" />
      </svg>
    ),
  },
  {
    href: "/admin/products",
    label: "商品マスタ",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8" />
      </svg>
    ),
  },
  {
    href: "/admin/imports",
    label: "CSV取込",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
      </svg>
    ),
  },
  {
    href: "/admin/inquiries",
    label: "見積依頼",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: "/admin/snapshots",
    label: "スナップショット",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 8v4l3 3" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
];

type Props = {
  displayName: string;
  role: string;
};

export function Sidebar({ displayName, role }: Props) {
  const pathname = usePathname();
  const initial = displayName.slice(0, 1);
  const roleLabel: Record<string, string> = {
    super_admin: "最高管理者",
    admin: "管理者",
    editor: "編集者",
    client: "クライアント",
  };

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-admin-navy">
      <div className="border-b border-white/10 px-5 py-6">
        <div className="text-[19px] font-bold tracking-[0.06em] text-white">
          SOUND·TRADE
        </div>
        <div className="mt-1 text-admin-xs text-white/50">管理画面</div>
      </div>
      <nav className="flex-1 py-3" aria-label="管理画面メニュー">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[48px] items-center gap-3 border-l-4 px-5 py-3.5 text-admin-base transition-colors ${
                active
                  ? "border-white bg-admin-navyHover font-bold text-white"
                  : "border-transparent text-white/75 hover:bg-admin-navyHover/60 hover:text-white"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-admin-navyHover text-admin-sm font-bold text-white">
            {initial}
          </div>
          <div>
            <div className="text-admin-sm font-medium text-white">
              {displayName}
            </div>
            <div className="text-admin-xs text-white/50">
              {roleLabel[role] ?? role}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
