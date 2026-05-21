import { getSiteUrl, SITE_NAME, SITE_DEFAULT_DESCRIPTION } from "@/lib/seo";

export function OrganizationJsonLd() {
  const url = getSiteUrl();
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url,
    description: SITE_DEFAULT_DESCRIPTION,
    legalName: "合同会社369",
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
