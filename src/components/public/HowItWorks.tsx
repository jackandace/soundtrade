import type { ReactNode } from "react";
import { Container } from "./Container";

type Step = {
  num: string;
  title: string;
  desc: string;
  icon: ReactNode;
};

// moheim 風ミニマルのライン アイコン（線幅 1.5 / 角丸 / accent 色）
const STEPS: Step[] = [
  {
    num: "01",
    title: "商品を探す",
    desc: "カテゴリやメーカーから商品を検索します",
    icon: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </>
    ),
  },
  {
    num: "02",
    title: "カートに追加",
    desc: "見積もりを取りたい商品をカートに入れます",
    icon: (
      <>
        <path d="M3 4h2l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L21 7H6" />
        <circle cx="9" cy="20" r="1.3" />
        <circle cx="18" cy="20" r="1.3" />
      </>
    ),
  },
  {
    num: "03",
    title: "見積依頼",
    desc: "会社情報を入力して見積もりを依頼します",
    icon: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </>
    ),
  },
  {
    num: "04",
    title: "見積回答",
    desc: "担当者より見積書をメールでお送りします",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M4 7l8 6 8-6" />
      </>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="flow" className="border-t border-line bg-white">
      <Container className="py-16 md:py-24">
        <div className="mb-8 md:mb-14">
          <div className="mb-3 font-dm text-[11px] tracking-[0.2em] text-accent">
            HOW IT WORKS
          </div>
          <h2 className="text-2xl font-normal tracking-[-0.01em] text-sumi md:text-[30px]">
            ご利用の流れ
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-4 md:gap-10">
          {STEPS.map((step) => (
            <div
              key={step.num}
              className="flex items-start gap-4 border-b border-line pb-5 md:block md:gap-0 md:border-0 md:pb-0"
            >
              {/* アイコン（ベージュ地の四角に accent 色のライン） */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-line bg-ivory md:mb-5 md:h-14 md:w-14">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-accent"
                  aria-hidden="true"
                >
                  {step.icon}
                </svg>
              </div>
              <div>
                <div className="mb-1.5 flex items-center gap-2.5">
                  <span className="font-dm text-[12px] tracking-[0.1em] text-accent">
                    {step.num}
                  </span>
                  <span className="text-base font-medium text-sumi">
                    {step.title}
                  </span>
                </div>
                <div className="text-[13px] leading-loose text-sumi-light">
                  {step.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
