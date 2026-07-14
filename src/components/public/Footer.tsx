import Link from "next/link";
import { type CategoryGroup, catalogHrefL1 } from "@/lib/categories";
import { Container } from "./Container";

type FooterItem = { label: string; href?: string };

const STATIC_SECTIONS: Array<{ title: string; items: FooterItem[] }> = [
  {
    title: "サービス",
    items: [
      { label: "カタログを見る", href: "/catalog" },
      { label: "ご利用の流れ", href: "/#flow" },
      { label: "取扱メーカー", href: "/catalog" },
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

export function Footer({ categoryNav }: { categoryNav: CategoryGroup[] }) {
  // 取扱カテゴリ列は大分類(category_l1)を DB から動的生成（商品追加で自動追従）
  const categoryItems: FooterItem[] = [
    ...categoryNav.map((g) => ({
      label: g.name,
      href: catalogHrefL1(g.name),
    })),
    { label: "すべてのカテゴリ", href: "/categories" },
  ];
  const sections = [
    { title: "取扱カテゴリ", items: categoryItems },
    ...STATIC_SECTIONS,
  ];

  return (
    <footer className="border-t border-line bg-beige">
      <Container className="pb-8 pt-12 md:pb-10 md:pt-16">
        <div className="flex flex-wrap justify-between gap-8 md:gap-12">
          <div className="max-w-full md:max-w-[280px]">
            <div className="mb-3 text-lg font-medium tracking-[0.08em] text-sumi">
              楽器卸のミツエス
            </div>
            <p className="text-[13px] leading-loose text-sumi-light">
              名古屋の楽器卸会社ミツエス。楽器・楽譜・音響機器の仕入れを、小売店・法人のお客様へ。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 md:flex md:gap-12">
            {sections.map((section) => (
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
          © 2026 株式会社ミツエス. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}
