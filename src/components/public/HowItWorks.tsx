import { Container } from "./Container";

const STEPS = [
  ["01", "商品を探す", "カテゴリやメーカーから商品を検索します"],
  ["02", "カートに追加", "見積もりを取りたい商品をカートに入れます"],
  ["03", "見積依頼", "会社情報を入力して見積もりを依頼します"],
  ["04", "見積回答", "担当者より見積書をメールでお送りします"],
] as const;

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
          {STEPS.map(([num, title, desc]) => (
            <div
              key={num}
              className="flex items-start gap-4 border-b border-line pb-5 md:block md:gap-0 md:border-0 md:pb-0"
            >
              <div className="shrink-0 font-dm text-[13px] tracking-[0.1em] text-accent md:mb-4 md:border-b md:border-line md:pb-4">
                {num}
              </div>
              <div>
                <div className="mb-2 text-base font-medium text-sumi">
                  {title}
                </div>
                <div className="text-[13px] leading-loose text-sumi-light">
                  {desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
