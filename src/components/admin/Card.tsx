import type { ReactNode } from "react";

export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-admin-line bg-admin-surface ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between border-b border-admin-lineLight px-5 py-4">
          <h2 className="text-admin-h3 font-bold text-admin-ink">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
