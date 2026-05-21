import { Container } from "./Container";

const SECTIONS: Array<[string, string[]]> = [
  ["取扱カテゴリ", ["クラリネット", "サクソフォン", "トランペット", "フルート"]],
  ["サービス", ["カタログを見る", "見積依頼の流れ", "取扱メーカー"]],
  [
    "会社情報",
    ["運営会社", "特定商取引法", "プライバシーポリシー", "お問い合わせ"],
  ],
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-beige">
      <Container className="pb-8 pt-12 md:pb-10 md:pt-16">
        <div className="flex flex-wrap justify-between gap-8 md:gap-12">
          <div className="max-w-full md:max-w-[280px]">
            <div className="mb-3 font-dm text-lg font-medium tracking-[0.12em] text-sumi">
              SOUND·TRADE
            </div>
            <p className="text-[13px] leading-loose text-sumi-light">
              楽器卸取引のための業務用プラットフォーム。確かな品質の楽器を、確かな価格で。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 md:flex md:gap-12">
            {SECTIONS.map(([title, items]) => (
              <div key={title}>
                <div className="mb-3.5 text-xs font-medium tracking-[0.08em] text-sumi">
                  {title}
                </div>
                {items.map((it) => (
                  <div
                    key={it}
                    className="mb-2 text-[13px] text-sumi-light"
                  >
                    {it}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 border-t border-line-mid pt-6 text-[11px] tracking-wider text-muted md:mt-12">
          © 2026 SOUND·TRADE / 合同会社369. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}
