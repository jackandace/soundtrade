export function ImagePlaceholder({
  label,
  aspectClass = "aspect-square",
  big = false,
}: {
  label?: string;
  aspectClass?: string;
  big?: boolean;
}) {
  const iconSize = big ? 44 : 28;
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden border border-line ${aspectClass}`}
      style={{
        background:
          "repeating-linear-gradient(135deg, #F4F0E8, #F4F0E8 12px, #FFFFFF 12px, #FFFFFF 24px)",
      }}
    >
      <div className="absolute inset-0 bg-ivory/80" />
      <div className="relative px-2 text-center">
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#888888"
          strokeWidth="1.3"
          className="mx-auto mb-1.5"
        >
          <rect x="3" y="3" width="18" height="18" rx="1.5" />
          <circle cx="8.5" cy="8.5" r="1.8" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        {label && (
          <div
            className={`leading-relaxed tracking-wider text-muted ${
              big ? "text-xs" : "text-[10px]"
            }`}
          >
            {label}
          </div>
        )}
      </div>
    </div>
  );
}
