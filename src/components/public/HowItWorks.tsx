import type { ReactNode } from "react";
import { Container } from "./Container";

type Highlight = { pre: string; big: string; post: string };
type Step = {
  num: string;
  title: string;
  desc: string;
  note?: string;
  highlight?: Highlight;
  icon: ReactNode;
};

// moheim 風ミニマルのライン イラスト（線幅 1.6 / accent 色 / 44px）
const STEPS: Step[] = [
  {
    num: "1",
    title: "商品を探す",
    desc: "カテゴリ・メーカーから見積したい商品を探します。",
    note: "一覧にない商品は「掲載外商品のお問い合わせ」からご相談いただけます。",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <line x1="3" y1="8" x2="21" y2="8" />
        <circle cx="11" cy="13" r="2.6" />
        <path d="M13 15l2 2" />
      </>
    ),
  },
  {
    num: "2",
    title: "見積カートを確定",
    desc: "気になる商品を見積カートに追加して確定します。",
    icon: (
      <>
        <path d="M3 4h2l2.1 10.7a1.4 1.4 0 0 0 1.4 1.1h7.7a1.4 1.4 0 0 0 1.4-1.1L19 8H6" />
        <path d="M9.5 11l1.6 1.6 3.4-3.4" />
        <circle cx="9.5" cy="20" r="1.3" />
        <circle cx="17" cy="20" r="1.3" />
      </>
    ),
  },
  {
    num: "3",
    title: "必要事項を入力",
    desc: "会社情報など必要事項を入力して送信します。",
    highlight: { pre: "約", big: "2", post: "分" },
    icon: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 3h6v2.4H9z" />
        <path d="M8.5 11l1.1 1.1 2-2.1" />
        <line x1="13" y1="10.5" x2="16" y2="10.5" />
        <path d="M8.5 15.5l1.1 1.1 2-2.1" />
        <line x1="13" y1="15" x2="16" y2="15" />
      </>
    ),
  },
  {
    num: "4",
    title: "担当者から返信",
    desc: "担当者が見積書をメールでお送りします。",
    highlight: { pre: "最短", big: "1", post: "営業日" },
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M4 7.5l8 5.5 8-5.5" />
      </>
    ),
  },
];

function StepIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-accent"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function Arrow() {
  return (
    <div
      className="flex shrink-0 items-center justify-center self-center text-accent md:px-1"
      aria-hidden="true"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="rotate-90 md:rotate-0"
      >
        <path d="M9 6l6 6-6 6" />
      </svg>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="flow" className="border-t border-line bg-white">
      <Container className="py-16 md:py-24">
        <div className="mb-9 flex flex-col gap-4 md:mb-14 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 font-dm text-[11px] tracking-[0.2em] text-accent">
              HOW IT WORKS
            </div>
            <h2 className="text-2xl font-normal tracking-[-0.01em] text-sumi md:text-[30px]">
              ご利用の流れ
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-sm bg-sumi px-4 py-2 text-[12px] tracking-wide text-white md:self-auto">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            会員登録不要・スピーディ
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-stretch md:gap-0">
          {STEPS.map((step, i) => (
            <div key={step.num} className="contents">
              <div className="relative flex flex-1 flex-col items-center rounded-sm border border-line bg-ivory px-5 pb-7 pt-9 text-center">
                <div className="absolute -top-3.5 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-sumi font-dm text-[12px] text-white">
                  {step.num}
                </div>
                <StepIcon>{step.icon}</StepIcon>
                <div className="mb-1.5 mt-4 text-[15px] font-medium text-sumi">
                  {step.title}
                </div>
                <div className="text-[12px] leading-relaxed text-sumi-light">
                  {step.desc}
                </div>
                {step.note && (
                  <div className="mt-3 rounded-sm bg-beige px-3 py-2 text-[11px] leading-relaxed text-sumi-light">
                    {step.note}
                  </div>
                )}
                {step.highlight && (
                  <div className="mt-auto pt-4 text-accent">
                    <span className="text-[13px]">{step.highlight.pre}</span>
                    <span className="px-0.5 text-[26px] font-semibold leading-none">
                      {step.highlight.big}
                    </span>
                    <span className="text-[13px]">{step.highlight.post}</span>
                  </div>
                )}
              </div>
              {i < STEPS.length - 1 && <Arrow />}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
