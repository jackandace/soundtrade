import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCategoryJp } from "@/lib/categories";
import { Container } from "@/components/public/Container";
import { ProductCard } from "@/components/public/ProductCard";
import { CatalogFilter } from "@/components/public/CatalogFilter";
import { pickPrimaryImage } from "@/lib/product-images";

export const dynamic = "force-dynamic";

export function generateMetadata({
  searchParams,
}: {
  searchParams: { category?: string };
}): Metadata {
  const jp = getCategoryJp(searchParams.category);
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

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const supabase = createClient();
  const selectedId = searchParams.category ?? null;
  const selectedJp = getCategoryJp(selectedId);

  let query = supabase
    .from("products")
    .select(
      "product_name, handle, category_l2, category_l3, product_images(url, is_primary, sort_order)",
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (selectedJp) {
    query = query.eq("category_l2", selectedJp);
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

  return (
    <div className="min-h-[70vh] bg-ivory">
      <Container className="pb-16 pt-8 md:pb-24 md:pt-16">
        <div className="mb-5 text-xs tracking-wider text-muted md:mb-8">
          ホーム ／ カタログ{selectedJp ? ` ／ ${selectedJp}` : ""}
        </div>
        <h1 className="mb-2 text-[26px] font-light tracking-[-0.01em] text-sumi md:text-[34px]">
          {selectedJp ?? "商品カタログ"}
        </h1>
        <p className="mb-8 text-[13px] text-sumi-light">
          全 {products?.length ?? 0} 件の楽器を取り扱っています
        </p>

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
              {(products?.length ?? 0) === 0 ? (
                <p className="py-12 text-center text-sm text-sumi-light">
                  該当する商品がありません。
                </p>
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
