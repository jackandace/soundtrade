import type { ReactNode } from "react";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto max-w-container px-5 md:px-12 ${className}`}>
      {children}
    </div>
  );
}
