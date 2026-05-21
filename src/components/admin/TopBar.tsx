"use client";

import { useAdminPrefs, type FontSize } from "@/contexts/admin-prefs-context";

const SIZES: Array<{ key: FontSize; label: string; textSize: string }> = [
  { key: "sm", label: "A-", textSize: "text-xs" },
  { key: "md", label: "A", textSize: "text-[15px]" },
  { key: "lg", label: "A+", textSize: "text-lg" },
];

export function TopBar({ title }: { title: string }) {
  const { size, setSize } = useAdminPrefs();

  return (
    <div className="flex h-[68px] items-center justify-between border-b border-admin-line bg-admin-surface px-8">
      <h1 className="text-admin-h2 font-bold text-admin-ink">{title}</h1>
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <span className="text-admin-xs text-admin-inkSub">文字サイズ</span>
          <div
            role="group"
            aria-label="文字サイズ切替"
            className="flex overflow-hidden rounded-md border border-admin-line"
          >
            {SIZES.map((s, i) => {
              const active = size === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSize(s.key)}
                  aria-pressed={active}
                  className={`flex min-h-10 min-w-11 items-center justify-center font-bold ${s.textSize} ${
                    active
                      ? "bg-admin-navy text-white"
                      : "bg-admin-surface text-admin-inkSub hover:bg-admin-surfaceAlt"
                  } ${i < SIZES.length - 1 ? "border-r border-admin-line" : ""}`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
