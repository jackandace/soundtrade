import { getSiteUrl, SITE_NAME } from "@/lib/seo";

type Props = {
  handle: string;
  productName: string;
  sku: string;
  maker: string | null;
  categoryL2: string | null;
  categoryL3: string | null;
  description: string | null;
};

export function ProductJsonLd({
  handle,
  productName,
  sku,
  maker,
  categoryL2,
  categoryL3,
  description,
}: Props) {
  const url = `${getSiteUrl()}/products/${handle}`;
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName,
    sku,
    url,
  };
  if (maker) data.brand = { "@type": "Brand", name: maker };
  if (categoryL2 || categoryL3) {
    data.category = [categoryL2, categoryL3].filter(Boolean).join(" / ");
  }
  if (description) data.description = description;
  // 価格完全クローズの方針に合わせ Offers / priceSpecification は出力しない。
  // 見積依頼で価格案内する旨は seller プロパティで示唆する。
  data.seller = {
    "@type": "Organization",
    name: SITE_NAME,
    url: getSiteUrl(),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
