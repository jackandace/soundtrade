import type { ReactNode } from "react";

type Variant = "success" | "warning" | "danger" | "info" | "neutral";

const STYLE: Record<Variant, { cls: string; icon: ReactNode }> = {
  success: {
    cls: "bg-admin-successBg text-admin-success border-admin-success/30",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ),
  },
  warning: {
    cls: "bg-admin-warningBg text-admin-warning border-admin-warning/30",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
        <path d="M12 9v4M12 17h.01" />
      </svg>
    ),
  },
  danger: {
    cls: "bg-admin-dangerBg text-admin-danger border-admin-danger/30",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M15 9l-6 6M9 9l6 6" />
      </svg>
    ),
  },
  info: {
    cls: "bg-admin-infoBg text-admin-info border-admin-info/30",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
    ),
  },
  neutral: {
    cls: "bg-admin-neutralBg text-admin-neutral border-admin-neutral/30",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
};

export function StatusBadge({
  variant,
  children,
}: {
  variant: Variant;
  children: ReactNode;
}) {
  const s = STYLE[variant];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded border px-2 py-1 text-admin-xs font-bold ${s.cls}`}
    >
      {s.icon}
      {children}
    </span>
  );
}
