import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { catalogHrefL1, catalogHrefL2 } from "@/lib/categories";
import { getCategoryNav } from "@/lib/categories-server";
import { getSiteUrl } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const fixed: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/catalog`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/categories`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/company`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const supabase = createClient();

  // カテゴリURL（DB連動：大分類 + 中分類）
  const nav = await getCategoryNav();
  const categoryEntries: MetadataRoute.Sitemap = [
    ...nav.map((g) => ({
      url: `${base}${catalogHrefL1(g.name)}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...nav.flatMap((g) =>
      g.children.map((c) => ({
        url: `${base}${catalogHrefL2(c.name)}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.7,
      })),
    ),
  ];
  const { data: products } = await supabase
    .from("products")
    .select("handle, updated_at")
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(5000);

  const productEntries: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${base}/products/${p.handle}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...fixed, ...categoryEntries, ...productEntries];
}
