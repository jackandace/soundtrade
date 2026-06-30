import Link from "next/link";

type Props = {
  currentPage: number;
  totalPages: number;
  /** 現在の絞り込み条件（page を除く）。リンクに引き継ぐ。 */
  baseParams: Record<string, string>;
};

function hrefFor(baseParams: Record<string, string>, page: number): string {
  const sp = new URLSearchParams(baseParams);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `/catalog?${qs}` : "/catalog";
}

// 1 … (current-1) current (current+1) … total の形で間引く
function pageWindow(current: number, total: number): Array<number | "…"> {
  const wanted = new Set<number>([
    1,
    total,
    current - 1,
    current,
    current + 1,
  ]);
  const nums = Array.from(wanted)
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);
  const out: Array<number | "…"> = [];
  let prev = 0;
  for (const n of nums) {
    if (n - prev > 1) out.push("…");
    out.push(n);
    prev = n;
  }
  return out;
}

const cellBase =
  "inline-flex h-10 min-w-[40px] items-center justify-center rounded-sm px-3 text-sm transition-colors";

export function Pagination({ currentPage, totalPages, baseParams }: Props) {
  if (totalPages <= 1) return null;
  const items = pageWindow(currentPage, totalPages);

  return (
    <nav
      aria-label="ページ送り"
      className="mt-10 flex flex-wrap items-center justify-center gap-1.5 md:mt-14"
    >
      {currentPage > 1 ? (
        <Link
          href={hrefFor(baseParams, currentPage - 1)}
          rel="prev"
          className={`${cellBase} border border-line-mid text-sumi hover:border-sumi`}
        >
          ← 前へ
        </Link>
      ) : (
        <span className={`${cellBase} border border-line text-muted`}>← 前へ</span>
      )}

      {items.map((it, i) =>
        it === "…" ? (
          <span key={`e${i}`} className="px-1 text-muted">
            …
          </span>
        ) : it === currentPage ? (
          <span
            key={it}
            aria-current="page"
            className={`${cellBase} border border-sumi bg-sumi font-medium text-white`}
          >
            {it}
          </span>
        ) : (
          <Link
            key={it}
            href={hrefFor(baseParams, it)}
            className={`${cellBase} border border-line-mid text-sumi hover:border-sumi`}
          >
            {it}
          </Link>
        ),
      )}

      {currentPage < totalPages ? (
        <Link
          href={hrefFor(baseParams, currentPage + 1)}
          rel="next"
          className={`${cellBase} border border-line-mid text-sumi hover:border-sumi`}
        >
          次へ →
        </Link>
      ) : (
        <span className={`${cellBase} border border-line text-muted`}>次へ →</span>
      )}
    </nav>
  );
}
