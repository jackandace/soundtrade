type Props = {
  defaultQuery?: string;
  /** 検索時に保持する他フィルタ（category, maker, tag など） */
  hidden?: Record<string, string>;
};

export function SearchBox({ defaultQuery = "", hidden = {} }: Props) {
  return (
    <form action="/catalog" method="get" className="flex w-full gap-2">
      {Object.entries(hidden).map(([k, v]) =>
        v ? <input key={k} type="hidden" name={k} value={v} /> : null,
      )}
      <div className="relative flex-1">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#888888"
          strokeWidth="1.6"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          type="search"
          name="q"
          defaultValue={defaultQuery}
          placeholder="商品名・メーカー・カテゴリで検索（例: クラリネット）"
          aria-label="商品検索"
          className="h-12 w-full border border-line-mid bg-white pl-11 pr-4 text-sm text-sumi outline-none placeholder:text-muted focus:border-sumi"
        />
      </div>
      <button
        type="submit"
        className="h-12 shrink-0 border border-sumi bg-sumi px-6 text-sm tracking-wider text-white transition-opacity hover:opacity-90"
      >
        検索
      </button>
    </form>
  );
}
