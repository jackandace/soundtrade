import Link from "next/link";
import { Container } from "./Container";

type FooterItem = { label: string; href?: string };

const SECTIONS: Array<{ title: string; items: FooterItem[] }> = [
  {
    title: "取扱カテゴリ",
    items: [
      { label: "クラリネット", href: "/catalog?category=clarinet" },
      { label: "サクソフォン", href: "/catalog?category=saxophone" },
      { label: "トランペット", href: "/catalog?category=trumpet" },
      { label: "フルート", href: "/catalog?category=flute" },
    ],
  },
  {
    title: "サービス",
    items: [
      { label: "カタログを見る", href: "/catalog" },
      { label: "ご利用の流れ", href: "/#flow" },
      { label: "取扱メーカー", href: "/#makers" },
      { label: "掲載外商品のお問い合わせ", href: "/contact" },
    ],
  },
  {
    title: "会社情報",
    items: [
      { label: "運営会社", href: "/company" },
      { label: "特定商取引法に基づく表記", href: "/legal" },
      { label: "プライバシーポリシー", href: "/privacy" },
      { label: "お問い合わせ", href: "/contact" },
    ],
  },
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
            {SECTIONS.map((section) => (
              <div key={section.title}>
                <div className="mb-3.5 text-xs font-medium tracking-[0.08em] text-sumi">
                  {section.title}
                </div>
                {section.items.map((it) =>
                  it.href ? (
                    <Link
                      key={it.label}
                      href={it.href}
                      className="mb-2 block text-[13px] text-sumi-light transition-colors hover:text-sumi"
                    >
                      {it.label}
                    </Link>
                  ) : (
                    <div
                      key={it.label}
                      className="mb-2 text-[13px] text-sumi-light"
                    >
                      {it.label}
                    </div>
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 border-t border-line-mid pt-6 text-[11px] tracking-wider text-muted md:mt-12">
          © 2026 SOUND·TRADE / 株式会社ミツエス. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}
