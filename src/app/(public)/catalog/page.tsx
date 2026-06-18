import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCategoryJp } from "@/lib/categories";
import { Container } from "@/components/public/Container";
import { SearchBox } from "@/components/public/SearchBox";
import { MakerFilter } from "@/components/public/MakerFilter";
import { CatalogView, type CatalogProduct } from "@/components/public/CatalogView";
import { pickPrimaryImage } from "@/lib/product-images";
import { parseTags } from "@/lib/tags";

export const dynamic = "force-dynamic";

type SearchParams = {
  category?: string;
  maker?: string;
  q?: string;
  tag?: string;
};

export function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Metadata {
  const jp = getCategoryJp(searchParams.category);
  const q = searchParams.q?.trim();
  const tag = searchParams.tag?.trim();
  const maker = searchParams.maker?.trim();
  if (q || tag) {
    const term = q || tag || "";
    return {
      title: `「${term}」の検索結果`,
      description: `「${term}」に一致する楽器の検索結果。`,
      robots: { index: false, follow: true },
    };
  }
  const label = maker ?? jp ?? null;
  const title = label ? `${label}の商品一覧` : "商品カタログ";
  const description = label
    ? `${label}の取扱商品一覧。管楽器・弦楽器・打楽器の卸プラットフォーム。`
    : "管楽器・弦楽器・打楽器の卸取扱商品一覧。法人・個人事業主のお客様向け。";
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  };
}

function sanitizeQuery(raw: string): string {
  return raw.replace(/[%,()*]/g, " ").trim().slice(0, 60);
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();
  const categoryId = searchParams.category ?? null;
  const categoryJp = getCategoryJp(categoryId);
  const selectedMaker = searchParams.maker?.trim() || null;
  const rawQuery = searchParams.q?.trim() ?? "";
  const keyword = sanitizeQuery(rawQuery);
  const tag = sanitizeQuery(searchParams.tag?.trim() ?? "");

  const SELECT =
    "product_name, handle, maker, category_l2, category_l3, msrp_incl_tax, tags, product_images(url, is_primary, sort_order)";

  // メイン商品クエリ（全フィルタ適用）
  let query = supabase
    .from("products")
    .select(SELECT)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (categoryJp) query = query.eq("category_l2", categoryJp);
  if (selectedMaker) query = query.eq("maker", selectedMaker);
  if (tag) query = query.ilike("tags", `%${tag}%`);
  if (keyword) {
    const like = `%${keyword}%`;
    query = query.or(
      [
        `product_name.ilike.${like}`,
        `maker.ilike.${like}`,
        `category_l2.ilike.${like}`,
        `category_l3.ilike.${like}`,
        `sku_base.ilike.${like}`,
        `tags.ilike.${like}`,
      ].join(","),
    );
  }

  // メーカー件数（メーカー以外の同条件で集計）
  let makerCountQuery = supabase
    .from("products")
    .select("maker")
    .eq("status", "active");
  if (categoryJp) makerCountQuery = makerCountQuery.eq("category_l2", categoryJp);
  if (tag) makerCountQuery = makerCountQuery.ilike("tags", `%${tag}%`);

  const [{ data: rows, error }, { data: makerRows }] = await Promise.all([
    query,
    makerCountQuery,
  ]);

  const products: CatalogProduct[] = (rows ?? []).map((p) => ({
    productName: p.product_name,
    handle: p.handle,
    maker: p.maker,
    categoryL2: p.category_l2,
    categoryL3: p.category_l3,
    imageUrl: pickPrimaryImage(p.product_images),
    msrpInclTax: p.msrp_incl_tax,
    tags: parseTags(p.tags),
  }));

  const makerCount = new Map<string, number>();
  for (const r of makerRows ?? []) {
    if (r.maker) makerCount.set(r.maker, (makerCount.get(r.maker) ?? 0) + 1);
  }
  const makers = Array.from(makerCount.entries())
    .map(([maker, count]) => ({ maker, count }))
    .sort((a, b) => b.count - a.count || a.maker.localeCompare(b.maker));
  const makerTotal = (makerRows ?? []).length;

  // 検索時に保持する共通パラメータ
  const baseParams: Record<string, string> = {};
  if (categoryId) baseParams.category = categoryId;
  if (keyword) baseParams.q = rawQuery;
  if (tag) baseParams.tag = tag;

  const resultCount = products.length;
  const heading =
    keyword || tag
      ? `「${rawQuery || tag}」の検索結果`
      : (selectedMaker ?? categoryJp ?? "商品カタログ");

  const hasFilter = Boolean(keyword || tag || selectedMaker || categoryJp);

  return (
    <div className="min-h-[70vh] bg-ivory">
      <Container className="pb-16 pt-8 md:pb-24 md:pt-16">
        <div className="mb-5 text-xs tracking-wider text-muted md:mb-8">
          ホーム ／ カタログ
          {categoryJp ? ` ／ ${categoryJp}` : ""}
        </div>
        <h1 className="mb-2 text-[26px] font-light tracking-[-0.01em] text-sumi md:text-[34px]">
          {heading}
        </h1>
        <p className="mb-6 text-[13px] text-sumi-light">
          {hasFilter
            ? `${resultCount} 件が見つかりました`
            : `全 ${resultCount} 件の楽器を取り扱っています`}
          {hasFilter && (
            <>
              {"　"}
              <Link
                href="/catalog"
                className="border-b border-sumi-light text-sumi-light hover:text-sumi"
              >
                条件をクリア
              </Link>
            </>
          )}
        </p>

        <div className="mb-3">
          <SearchBox defaultQuery={rawQuery} hidden={baseParams} />
        </div>
        <p className="mb-6 text-xs text-sumi-light">
          お探しの商品が見つからない場合は{" "}
          <Link
            href="/contact"
            className="border-b border-accent text-accent hover:text-sumi"
          >
            掲載外商品のお問い合わせ
          </Link>
          {" "}も承ります。
        </p>

        {error ? (
          <p className="text-sm text-err">
            商品の取得に失敗しました: {error.message}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr] md:gap-12">
            <MakerFilter
              total={makerTotal}
              makers={makers}
              selectedMaker={selectedMaker}
              baseParams={baseParams}
            />
            <div>
              {resultCount === 0 ? (
                <div className="border border-line bg-white px-6 py-12 text-center">
                  <p className="mb-2 text-sm text-sumi">
                    {keyword || tag
                      ? `「${rawQuery || tag}」に一致する商品が見つかりませんでした。`
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
                <CatalogView products={products} />
              )}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
