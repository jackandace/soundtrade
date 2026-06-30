import type { Metadata } from "next";
import Link from "next/link";
import { catalogHrefL1, catalogHrefL2 } from "@/lib/categories";
import { getCategoryNav } from "@/lib/categories-server";
import { Container } from "@/components/public/Container";

// ISR: CDN キャッシュ + 10分ごとに再生成（更新時は on-demand 再検証で即時反映）
export const revalidate = 600;

export const metadata: Metadata = {
  title: "取扱カテゴリ一覧",
  description:
    "管楽器・鍵盤楽器など、楽器卸のミツエスで取り扱う商品カテゴリの一覧です。大分類・中分類からお探しの商品をお選びいただけます。",
  openGraph: {
    title: "取扱カテゴリ一覧",
    description: "楽器卸のミツエスの取扱商品カテゴリ一覧。",
    type: "website",
  },
};

export default async function CategoriesPage() {
  const nav = await getCategoryNav();

  return (
    <div className="min-h-[70vh] bg-ivory">
      <Container className="pb-16 pt-8 md:pb-24 md:pt-16">
        <div className="mb-5 text-xs tracking-wider text-muted md:mb-8">
          <Link href="/" className="transition-colors hover:text-sumi hover:underline">
            ホーム
          </Link>
          {" ／ 取扱カテゴリ"}
        </div>
        <h1 className="mb-2 text-[26px] font-light tracking-[-0.01em] text-sumi md:text-[34px]">
          取扱カテゴリ
        </h1>
        <p className="mb-10 text-[13px] text-sumi-light md:mb-14">
          大分類・中分類から商品をお探しいただけます。お探しの商品が見つからない場合は{" "}
          <Link
            href="/contact"
            className="border-b border-accent text-accent hover:text-sumi"
          >
            掲載外商品のお問い合わせ
          </Link>{" "}
          も承ります。
        </p>

        {nav.length === 0 ? (
          <p className="text-sm text-sumi-light">
            現在表示できるカテゴリがありません。{" "}
            <Link href="/catalog" className="text-accent hover:text-sumi">
              すべての商品を見る →
            </Link>
          </p>
        ) : (
          <div className="space-y-12">
            {nav.map((g) => (
              <section key={g.name}>
                <div className="mb-5 flex items-baseline gap-3 border-b border-line pb-3">
                  <Link
                    href={catalogHrefL1(g.name)}
                    className="text-xl font-medium text-sumi transition-colors hover:text-accent md:text-2xl"
                  >
                    {g.name}
                  </Link>
                  <span className="font-dm text-xs tracking-wider text-muted">
                    {g.count}点
                  </span>
                </div>
                {g.children.length > 0 ? (
                  <div className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 md:grid-cols-3">
                    {g.children.map((c) => (
                      <Link
                        key={c.name}
                        href={catalogHrefL2(c.name)}
                        className="flex items-center justify-between bg-white px-5 py-4 transition-colors hover:bg-beige"
                      >
                        <span className="text-sm text-sumi">{c.name}</span>
                        <span className="font-dm text-[11px] tracking-wider text-muted">
                          {c.count}点
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    href={catalogHrefL1(g.name)}
                    className="inline-block text-sm text-accent hover:text-sumi"
                  >
                    {g.name}の商品を見る →
                  </Link>
                )}
              </section>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
