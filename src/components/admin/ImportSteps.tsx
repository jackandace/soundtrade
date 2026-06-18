const STEPS = [
  { n: 1, label: "アップロード" },
  { n: 2, label: "内容チェック" },
  { n: 3, label: "確認" },
  { n: 4, label: "反映" },
];

/** CSV取込の進行ステップ表示。current は 1〜4。 */
export function ImportSteps({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-1 overflow-x-auto">
      {STEPS.map((s, i) => {
        const done = s.n < current;
        const active = s.n === current;
        return (
          <li key={s.n} className="flex items-center gap-1">
            <div
              className={`flex items-center gap-2 rounded-md px-3 py-2 ${
                active
                  ? "bg-admin-navy text-white"
                  : done
                    ? "bg-admin-successBg text-admin-success"
                    : "bg-admin-surfaceAlt text-admin-inkMute"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-admin-xs font-bold ${
                  active
                    ? "bg-white text-admin-navy"
                    : done
                      ? "bg-admin-success text-white"
                      : "bg-admin-line text-admin-inkMute"
                }`}
              >
                {done ? "✓" : s.n}
              </span>
              <span className="whitespace-nowrap text-admin-sm font-medium">
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className="text-admin-inkMute">›</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
