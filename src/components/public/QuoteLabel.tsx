export function QuoteLabel({ size = "md" }: { size?: "sm" | "md" }) {
  const fs = size === "sm" ? 12 : 13;
  return (
    <span
      className="inline-flex items-center gap-1.5 font-medium tracking-wider text-accent"
      style={{ fontSize: fs }}
    >
      <svg
        width={fs}
        height={fs}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#B8956A"
        strokeWidth="1.7"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      お見積もり対応
    </span>
  );
}
