import type { Metadata } from "next";
import Link from "next/link";
import { getActiveProducts } from "@/lib/catalog-data";
import { getCategoryJp, catalogHrefL1 } from "@/lib/categories";
import { Container } from "@/components/public/Container";
import { SearchBox } from "@/components/public/SearchBox";
import { MakerFilter } from "@/components/public/MakerFilter";
import { CatalogView, type CatalogProduct } from "@/components/public/CatalogView";
import { pickPrimaryImage } from "@/lib/product-images";
import { parseTags } from "@/lib/tags";

// searchParams に依存するため動的レンダリング（force-dynamic 指定は不要）。
// レイアウトの getCategoryNav はキャッシュ済み。

type SearchParams = {
  l1?: string; // 大分類 (category_l1)
  l2?: string; // 中分類 (category_l2)
  category?: string; // 旧英字ID（後方互換）
  maker?: string;
  q?: string;
  tag?: string;
};

export function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Metadata {
  const catLabel =
    searchParams.l2?.trim() ||
    searchParams.l1?.trim() ||
    getCategoryJp(searchParams.category) ||
    null;
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
  const label = maker ?? catLabel ?? null;
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
  const rawL1 = searchParams.l1?.trim() || "";
  const rawL2 = searchParams.l2?.trim() || "";
  const legacyJp = getCategoryJp(searchParams.category); // 旧 ?category= の後方互換
  const l1Filter = rawL1 || null;
  const l2Filter = rawL2 || legacyJp || null;
  const categoryLabel = l2Filter || l1Filter || null;
  const selectedMaker = searchParams.maker?.trim() || null;
  const rawQuery = searchParams.q?.trim() ?? "";
  const keyword = sanitizeQuery(rawQuery);
  const tag = sanitizeQuery(searchParams.tag?.trim() ?? "");

  // キャッシュ済みの全公開商品をメモリ上で絞り込み（DB往復ゼロ）
  const all = await getActiveProducts();
  const lc = (s: string | null | undefined) => (s ?? "").toLowerCase();
  const tagLc = tag.toLowerCase();
  const kwLc = keyword.toLowerCase();

  // メーカーファセットのベース: l1/l2/tag のみ適用（keyword/maker は除外＝従来挙動）
  const facetBase = all.filter(
    (p) =>
      (!l1Filter || p.category_l1 === l1Filter) &&
      (!l2Filter || p.category_l2 === l2Filter) &&
      (!tag || lc(p.tags).includes(tagLc)),
  );

  // メイン一覧: facetBase に maker + キーワード（複数フィールド横断）を追加適用
  const matchedRows = facetBase.filter(
    (p) =>
      (!selectedMaker || p.maker === selectedMaker) &&
      (!keyword ||
        lc(p.product_name).includes(kwLc) ||
        lc(p.maker).includes(kwLc) ||
        lc(p.category_l2).includes(kwLc) ||
        lc(p.category_l3).includes(kwLc) ||
        lc(p.sku_base).includes(kwLc) ||
        lc(p.tags).includes(kwLc)),
  );

  const products: CatalogProduct[] = matchedRows.map((p) => ({
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
  for (const p of facetBase) {
    if (p.maker) makerCount.set(p.maker, (makerCount.get(p.maker) ?? 0) + 1);
  }
  const makers = Array.from(makerCount.entries())
    .map(([maker, count]) => ({ maker, count }))
    .sort((a, b) => b.count - a.count || a.maker.localeCompare(b.maker));
  const makerTotal = facetBase.length;

  // 検索時に保持する共通パラメータ
  const baseParams: Record<string, string> = {};
  if (rawL1) baseParams.l1 = rawL1;
  if (rawL2) baseParams.l2 = rawL2;
  else if (searchParams.category) baseParams.category = searchParams.category;
  if (keyword) baseParams.q = rawQuery;
  if (tag) baseParams.tag = tag;

  const resultCount = products.length;
  const heading =
    keyword || tag
      ? `「${rawQuery || tag}」の検索結果`
      : (selectedMaker ?? categoryLabel ?? "商品カタログ");

  const hasFilter = Boolean(keyword || tag || selectedMaker || categoryLabel);

  return (
    <div className="min-h-[70vh] bg-ivory">
      <Container className="pb-16 pt-8 md:pb-24 md:pt-16">
        <nav
          aria-label="パンくず"
          className="mb-5 text-xs tracking-wider text-muted md:mb-8"
        >
          <Link href="/" className="transition-colors hover:text-sumi hover:underline">
            ホーム
          </Link>
          {" ／ "}
          <Link
            href="/catalog"
            className="transition-colors hover:text-sumi hover:underline"
          >
            カタログ
          </Link>
          {l1Filter && (
            <>
              {" ／ "}
              {l2Filter ? (
                <Link
                  href={catalogHrefL1(l1Filter)}
                  className="transition-colors hover:text-sumi hover:underline"
                >
                  {l1Filter}
                </Link>
              ) : (
                <span className="text-sumi">{l1Filter}</span>
              )}
            </>
          )}
          {l2Filter && (
            <>
              {" ／ "}
              <span className="text-sumi">{l2Filter}</span>
            </>
          )}
        </nav>
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
      </Container>
    </div>
  );
}
