import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/server";
import { Container } from "@/components/public/Container";
import { ImagePlaceholder } from "@/components/public/ImagePlaceholder";
import { AddToCartForm } from "@/components/public/AddToCartForm";
import { ProductJsonLd } from "@/components/json-ld/Product";
import { SITE_DEFAULT_DESCRIPTION } from "@/lib/seo";
import { formatListPrice } from "@/lib/price";
import { parseTags } from "@/lib/tags";

// ISR(オンデマンド): 初回アクセス時に生成→CDNキャッシュ。10分ごと/更新時(on-demand)に再生成。
// ※ build 時の全件事前生成(558ページ)はビルド負荷が高いため行わず、訪問時生成に切替。
export const revalidate = 600;
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: { handle: string };
}): Promise<Metadata> {
  const supabase = createPublicClient();
  const { data: product } = await supabase
    .from("products")
    .select("product_name, category_l2, category_l3, description_short, maker")
    .eq("handle", params.handle)
    .eq("status", "active")
    .maybeSingle();

  if (!product) {
    // 該当なしは page 側で notFound()。ここは not-found 表示用のタイトルを返す。
    // （ISR ルートのため HTTP は 200 のソフト404。実害は無く SEO 上も未リンク・非サイトマップ）
    return { title: "商品が見つかりません", robots: { index: false, follow: false } };
  }

  const parts = [product.category_l2, product.category_l3].filter(Boolean);
  const subtitle = parts.length > 0 ? ` | ${parts.join(" / ")}` : "";
  const title = `${product.product_name}${subtitle}`;
  const description =
    product.description_short ??
    `${product.maker ?? ""} ${product.product_name} の見積依頼。${SITE_DEFAULT_DESCRIPTION}`;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
    },
    alternates: { canonical: `/products/${params.handle}` },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: { handle: string };
}) {
  const supabase = createPublicClient();

  const { data: product, error } = await supabase
    .from("products")
    .select(
      "id, product_name, handle, sku_base, maker, category_l1, category_l2, category_l3, description_short, description_long, msrp_incl_tax, tags",
    )
    .eq("handle", params.handle)
    .eq("status", "active")
    .maybeSingle();

  if (error || !product) {
    notFound();
  }

  const { data: specs } = await supabase
    .from("product_specs")
    .select("spec_label, spec_value, sort_order")
    .eq("product_id", product.id)
    .order("sort_order", { ascending: true });

  const { data: imageRows } = await supabase
    .from("product_images")
    .select("url, alt_text, is_primary, sort_order")
    .eq("product_id", product.id)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true });
  const images = imageRows ?? [];
  const mainImage = images[0]?.url ?? null;
  const thumbs = images.slice(0, 4);
  const listPrice = formatListPrice(product.msrp_incl_tax);
  const tags = parseTags(product.tags);

  return (
    <div className="min-h-[70vh] bg-ivory">
      <ProductJsonLd
        handle={product.handle}
        productName={product.product_name}
        sku={product.sku_base}
        maker={product.maker}
        categoryL2={product.category_l2}
        categoryL3={product.category_l3}
        description={product.description_short ?? product.description_long}
      />
      <Container className="pb-16 pt-6 md:pb-24 md:pt-16">
        <div className="mb-6 text-xs tracking-wider text-muted md:mb-10">
          <Link href="/catalog" className="hover:text-sumi">
            カタログ
          </Link>
          {product.category_l2 && (
            <>
              <span> / </span>
              <span>{product.category_l2}</span>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-[72px]">
          <div>
            <div className="mb-3">
              {mainImage ? (
                <div className="relative aspect-square overflow-hidden border border-line bg-white">
                  <Image
                    src={mainImage}
                    alt={images[0]?.alt_text ?? product.product_name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain"
                    priority
                  />
                </div>
              ) : (
                <ImagePlaceholder
                  label={`${product.product_name} の商品写真`}
                  big
                />
              )}
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {[0, 1, 2, 3].map((i) => {
                const t = thumbs[i];
                return (
                  <div
                    key={i}
                    className={i === 0 && mainImage ? "border border-sumi" : ""}
                  >
                    {t ? (
                      <div className="relative aspect-square overflow-hidden border border-line bg-white">
                        <Image
                          src={t.url}
                          alt={t.alt_text ?? product.product_name}
                          fill
                          sizes="120px"
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <ImagePlaceholder />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            {product.category_l2 && (
              <div className="mb-3 font-dm text-xs tracking-[0.1em] text-muted">
                {product.category_l2}
              </div>
            )}
            <h1 className="mb-2 text-2xl font-normal tracking-[-0.01em] text-sumi md:text-[32px]">
              {product.product_name}
            </h1>
            {product.category_l3 && (
              <div className="mb-4 text-sm text-sumi-light">
                {product.category_l3}
              </div>
            )}

            {tags.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <Link
                    key={t}
                    href={`/catalog?tag=${encodeURIComponent(t)}`}
                    className="rounded-sm border border-line bg-beige px-2.5 py-1 text-xs text-sumi-light transition-colors hover:border-line-mid hover:text-sumi"
                  >
                    {t}
                  </Link>
                ))}
              </div>
            )}

            {listPrice && (
              <div className="mb-6 border-y border-line py-4">
                <div className="text-[11px] tracking-wider text-muted">
                  メーカー希望小売価格（定価）
                </div>
                <div className="mt-1 text-2xl font-light text-sumi">
                  {listPrice}
                </div>
                <div className="mt-1.5 text-xs text-sumi-light">
                  卸価格はお取引内容・数量に応じて見積依頼で個別にご案内します。
                </div>
              </div>
            )}

            {specs && specs.length > 0 && (
              <div className="mb-7">
                <div className="mb-3 text-[13px] font-medium tracking-wider text-sumi">
                  主な仕様
                </div>
                <table className="w-full">
                  <tbody>
                    {specs.map((s, i) => (
                      <tr key={i} className="border-b border-line">
                        <td className="w-28 py-3 align-top text-[13px] text-sumi-light">
                          {s.spec_label}
                        </td>
                        <td className="py-3 text-[13px] text-sumi">
                          {s.spec_value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {product.description_short && (
              <p className="mb-7 text-[13px] leading-loose text-sumi-light">
                {product.description_short}
              </p>
            )}

            <AddToCartForm
              productName={product.product_name}
              handle={product.handle}
              categoryL1={product.category_l2}
              categoryL3={product.category_l3}
            />

            <p className="mt-4 text-xs leading-relaxed text-muted">
              ※
              当プラットフォームは楽器店、レンタル事業者、各種小売店、オフィスなどの法人様や楽器の講師等をされている個人事業主様を対象としております。一般消費者の皆さまは小売店からの購入をお願いします。卸価格は見積依頼後に担当者よりご案内します。
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
