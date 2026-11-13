// 管理画面の認証系ページ（ログイン / パスワード再設定）で共通の枠と部品。
// Server / Client どちらからも使えるよう、状態は持たない。

export function AuthShell({
  children,
  subtitle = "管理画面",
}: {
  children?: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-admin-bg px-5 py-12">
      <div className="w-full max-w-[420px] rounded-lg border border-admin-line bg-admin-surface p-8 md:p-10">
        <div className="mb-8 text-center">
          <div className="text-xl font-bold tracking-[0.04em] text-admin-ink">
            楽器卸のミツエス
          </div>
          <div className="mt-1 text-admin-xs text-admin-inkMute">{subtitle}</div>
        </div>
        {children}
      </div>
    </div>
  );
}

export const AUTH_INPUT_CLASS =
  "block w-full min-h-12 rounded-md border border-admin-line bg-admin-surface px-3.5 text-admin-base text-admin-ink outline-none focus:border-admin-navy";

export const AUTH_BUTTON_CLASS =
  "flex min-h-12 w-full items-center justify-center rounded-md bg-admin-navy px-6 text-admin-base font-bold tracking-wider text-white hover:bg-admin-navyHover disabled:opacity-50";

export function AuthLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-admin-sm font-medium text-admin-ink">
      {children}
      <span className="ml-2 text-admin-xs text-admin-danger">※必須</span>
    </label>
  );
}

type Tone = "danger" | "success" | "info";

const TONE_CLASS: Record<Tone, string> = {
  danger: "border-admin-danger/30 bg-admin-dangerBg text-admin-danger",
  success: "border-admin-success/30 bg-admin-successBg text-admin-success",
  info: "border-admin-info/30 bg-admin-infoBg text-admin-info",
};

// CUD 準拠: 色 + アイコン + テキストの三重表現
function ToneIcon({ tone }: { tone: Tone }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    className: "mt-0.5 shrink-0",
    "aria-hidden": true,
  } as const;
  if (tone === "success") {
    return (
      <svg {...common}>
        <path d="M20 6L9 17l-5-5" />
      </svg>
    );
  }
  if (tone === "info") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  );
}

export function AuthAlert({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={`flex items-start gap-2 rounded border px-3 py-2.5 text-admin-sm ${TONE_CLASS[tone]}`}
    >
      <ToneIcon tone={tone} />
      <span>{children}</span>
    </div>
  );
}
