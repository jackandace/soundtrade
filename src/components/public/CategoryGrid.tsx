import Link from "next/link";
import { topCategories, catalogHrefL2 } from "@/lib/categories";
import { getCategoryNav } from "@/lib/categories-server";
import { Container } from "./Container";
import { ImagePlaceholder } from "./ImagePlaceholder";

// トップに出す主要カテゴリ件数（残りは「すべて見る」へ）
const TOP_N = 8;

export async function CategoryGrid() {
  const nav = await getCategoryNav();
  const primary = topCategories(nav, TOP_N);
  const totalCount = nav.reduce((s, g) => s + g.children.length, 0);

  if (primary.length === 0) return null;

  return (
    <section className="border-t border-line bg-white">
      <Container className="py-16 md:py-24">
        <div className="mb-9 flex items-end justify-between md:mb-14">
          <div>
            <div className="mb-3 font-dm text-[11px] tracking-[0.2em] text-accent">
              CATEGORY
            </div>
            <h2 className="text-2xl font-normal tracking-[-0.01em] text-sumi md:text-[30px]">
              取扱カテゴリ
            </h2>
          </div>
          <Link
            href="/categories"
            className="hidden shrink-0 border-b border-line-mid pb-0.5 text-sm text-sumi-light transition-colors hover:border-sumi hover:text-sumi md:inline-block"
          >
            すべて見る（{totalCount}カテゴリ） →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
          {primary.map((c) => (
            <Link
              key={c.name}
              href={catalogHrefL2(c.name)}
              className="flex flex-col items-center gap-3 bg-ivory px-3.5 py-6 transition-opacity duration-300 hover:opacity-75 md:px-6 md:py-9"
            >
              <div className="w-[60px] md:w-20">
                <ImagePlaceholder />
              </div>
              <div className="text-center">
                <div className="text-[13px] font-medium text-sumi md:text-sm">
                  {c.name}
                </div>
                <div className="mt-0.5 font-dm text-[10px] tracking-[0.08em] text-muted">
                  {c.count}点
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center md:hidden">
          <Link
            href="/categories"
            className="inline-block border border-line-mid px-6 py-3 text-sm text-sumi transition-colors hover:border-sumi"
          >
            すべてのカテゴリを見る →
          </Link>
        </div>
      </Container>
    </section>
  );
}
