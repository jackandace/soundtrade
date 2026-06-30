import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/server";
import type { CategoryGroup } from "@/lib/categories";

// 大分類→中分類の集計（公開 active 商品）。cookie 不使用の anon クライアントで取得し、
// unstable_cache でリクエストをまたいでキャッシュ（tag "categories" で on-demand 再検証）。
const loadCategoryNav = unstable_cache(
  async (): Promise<CategoryGroup[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("products")
      .select("category_l1, category_l2")
      .eq("status", "active");

    if (error || !data) return [];

    const groups = new Map<
      string,
      { count: number; children: Map<string, number> }
    >();

    for (const row of data) {
      const l1 = (row.category_l1 ?? "").trim();
      if (!l1) continue;
      let g = groups.get(l1);
      if (!g) {
        g = { count: 0, children: new Map() };
        groups.set(l1, g);
      }
      g.count += 1;
      const l2 = (row.category_l2 ?? "").trim();
      if (l2) g.children.set(l2, (g.children.get(l2) ?? 0) + 1);
    }

    const byCount = (
      a: { count: number; name: string },
      b: { count: number; name: string },
    ) => b.count - a.count || a.name.localeCompare(b.name, "ja");

    return Array.from(groups.entries())
      .map(([name, g]) => ({
        name,
        count: g.count,
        children: Array.from(g.children.entries())
          .map(([cn, c]) => ({ name: cn, count: c }))
          .sort(byCount),
      }))
      .sort(byCount);
  },
  ["category-nav"],
  { tags: ["categories", "products"], revalidate: 600 },
);

/** 大分類→中分類のカテゴリツリー（件数つき・キャッシュ済み） */
export const getCategoryNav = cache((): Promise<CategoryGroup[]> =>
  loadCategoryNav(),
);
