import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCategoryJp } from "@/lib/categories";
import { Container } from "@/components/public/Container";
import { ProductCard } from "@/components/public/ProductCard";
import { CatalogFilter } from "@/components/public/CatalogFilter";
import { SearchBox } from "@/components/public/SearchBox";
import { pickPrimaryImage } from "@/lib/product-images";

export const dynamic = "force-dynamic";

export function generateMetadata({
  searchParams,
}: {
  searchParams: { category?: string; q?: string };
}): Metadata {
  const jp = getCategoryJp(searchParams.category);
  const q = searchParams.q?.trim();
  if (q) {
    const title = `「${q}」の検索結果`;
    const description = `「${q}」に一致する楽器の検索結果。管楽器・弦楽器・打楽器の卸プラットフォーム。`;
    return {
      title,
      description,
      robots: { index: false, follow: true },
    };
  }
  const title = jp ? `${jp}の商品一覧` : "商品カタログ";
  const description = jp
    ? `${jp}の取扱商品一覧。管楽器・弦楽器・打楽器の卸プラットフォーム。`
    : "管楽器・弦楽器・打楽器の卸取扱商品一覧。楽器店・スタジオ・教育機関のお客様向け。";
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    alternates: {
      canonical: jp ? `/catalog?category=${searchParams.category}` : "/catalog",
    },
  };
}

/** PostgREST の or フィルタに渡せないメタ文字を無害化する */
function sanitizeQuery(raw: string): string {
  return raw.replace(/[%,()*]/g, " ").trim().slice(0, 60);
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string };
}) {
  const supabase = createClient();
  const selectedId = searchParams.category ?? null;
  const selectedJp = getCategoryJp(selectedId);
  const rawQuery = searchParams.q?.trim() ?? "";
  const keyword = sanitizeQuery(rawQuery);

  let query = supabase
    .from("products")
    .select(
      "product_name, handle, category_l2, category_l3, msrp_incl_tax, product_images(url, is_primary, sort_order)",
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (selectedJp) {
    query = query.eq("category_l2", selectedJp);
  }

  if (keyword) {
    const like = `%${keyword}%`;
    query = query.or(
      [
        `product_name.ilike.${like}`,
        `maker.ilike.${like}`,
        `category_l2.ilike.${like}`,
        `category_l3.ilike.${like}`,
        `sku_base.ilike.${like}`,
      ].join(","),
    );
  }

  const [{ data: products, error }, { data: countRows }] = await Promise.all([
    query,
    supabase.from("products").select("category_l2").eq("status", "active"),
  ]);

  const countMap: Record<string, number> = {};
  let total = 0;
  for (const row of countRows ?? []) {
    if (row.category_l2) {
      countMap[row.category_l2] = (countMap[row.category_l2] ?? 0) + 1;
      total++;
    }
  }

  const resultCount = products?.length ?? 0;
  const heading = keyword
    ? `「${rawQuery}」の検索結果`
    : (selectedJp ?? "商品カタログ");

  return (
    <div className="min-h-[70vh] bg-ivory">
      <Container className="pb-16 pt-8 md:pb-24 md:pt-16">
        <div className="mb-5 text-xs tracking-wider text-muted md:mb-8">
          ホーム ／ カタログ
          {keyword ? ` ／ 検索` : selectedJp ? ` ／ ${selectedJp}` : ""}
        </div>
        <h1 className="mb-2 text-[26px] font-light tracking-[-0.01em] text-sumi md:text-[34px]">
          {heading}
        </h1>
        <p className="mb-6 text-[13px] text-sumi-light">
          {keyword
            ? `${resultCount} 件が見つかりました`
            : `全 ${resultCount} 件の楽器を取り扱っています`}
          {keyword && (
            <>
              {"　"}
              <Link
                href={
                  selectedJp ? `/catalog?category=${selectedId}` : "/catalog"
                }
                className="border-b border-sumi-light text-sumi-light hover:text-sumi"
              >
                検索をクリア
              </Link>
            </>
          )}
        </p>

        <div className="mb-8">
          <SearchBox defaultQuery={rawQuery} selectedCategory={selectedId} />
        </div>

        {error ? (
          <p className="text-sm text-err">
            商品の取得に失敗しました: {error.message}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr] md:gap-14">
            <CatalogFilter
              total={total}
              countMap={countMap}
              selectedId={selectedId}
            />
            <div>
              {resultCount === 0 ? (
                <div className="border border-line bg-white px-6 py-12 text-center">
                  <p className="mb-2 text-sm text-sumi">
                    {keyword
                      ? `「${rawQuery}」に一致する商品が見つかりませんでした。`
                      : "該当する商品がありません。"}
                  </p>
                  <p className="mb-6 text-[13px] leading-relaxed text-sumi-light">
                    お探しの商品がカタログに無い場合も、お取り寄せ可能なことがあります。
                    <br />
                    商品名や品番を添えてお気軽にお問い合わせください。
                  </p>
                  <Link
                    href={
                      keyword
                        ? `/contact?q=${encodeURIComponent(rawQuery)}`
                        : "/contact"
                    }
                    className="inline-block border border-sumi bg-sumi px-8 py-3.5 text-sm tracking-wider text-white transition-opacity hover:opacity-90"
                  >
                    掲載外商品をお問い合わせ
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-5 md:grid-cols-3 md:gap-10">
                  {(products ?? []).map((p) => (
                    <ProductCard
                      key={p.handle}
                      productName={p.product_name}
                      handle={p.handle}
                      categoryL1={p.category_l2}
                      categoryL3={p.category_l3}
                      imageUrl={pickPrimaryImage(p.product_images)}
                      msrpInclTax={p.msrp_incl_tax}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
