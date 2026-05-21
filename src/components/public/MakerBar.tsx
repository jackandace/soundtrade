const MAKERS = [
  "YAMAHA",
  "Roland",
  "KORG",
  "SUZUKI",
  "Pearl",
  "BUFFET CRAMPON",
  "Bach",
  "Selmer",
  "MURAMATSU",
  "Jupiter",
];

export function MakerBar() {
  const items = [...MAKERS, ...MAKERS];

  return (
    <section
      id="makers"
      className="border-b border-line bg-white py-3.5 md:py-4"
    >
      <div className="mx-auto flex max-w-container items-center md:gap-6 md:px-12">
        <div className="hidden shrink-0 font-dm text-[11px] tracking-[0.12em] text-muted md:block">
          取扱メーカー
        </div>
        <div
          className="relative flex-1 overflow-hidden"
          style={{
            WebkitMaskImage:
              "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
            maskImage:
              "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
          }}
        >
          <div className="flex w-max animate-logo-scroll items-center gap-7 md:gap-11">
            {items.map((m, i) => (
              <span
                key={i}
                className="whitespace-nowrap font-dm text-[13px] font-medium tracking-[0.06em] text-sumi-light opacity-75 md:text-[15px]"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
