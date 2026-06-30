import { getSiteUrl, SITE_NAME, SITE_DEFAULT_DESCRIPTION } from "@/lib/seo";

export function OrganizationJsonLd() {
  const url = getSiteUrl();
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url,
    description: SITE_DEFAULT_DESCRIPTION,
    legalName: "株式会社ミツエス",
    telephone: "052-451-1161",
    email: "satot@mitsuesu.ne.jp",
    address: {
      "@type": "PostalAddress",
      postalCode: "453-0801",
      addressRegion: "愛知県",
      addressLocality: "名古屋市中村区",
      streetAddress: "太閤5-9-9",
      addressCountry: "JP",
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
