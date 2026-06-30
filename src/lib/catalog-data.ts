import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/server";
import type { ProductImageRef } from "@/lib/product-images";

export type ActiveProduct = {
  product_name: string;
  handle: string;
  maker: string | null;
  category_l1: string | null;
  category_l2: string | null;
  category_l3: string | null;
  sku_base: string | null;
  msrp_incl_tax: number | null;
  tags: string | null;
  product_images: ProductImageRef[] | null;
};

// 公開中の全商品を1回だけ取得しキャッシュ（tag "products" で更新時に失効）。
// カタログの絞り込み・メーカー件数はこの配列に対してメモリ上で行う＝毎回のDB往復を排除。
const loadActiveProducts = unstable_cache(
  async (): Promise<ActiveProduct[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        "product_name, handle, maker, category_l1, category_l2, category_l3, sku_base, msrp_incl_tax, tags, product_images(url, is_primary, sort_order)",
      )
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data as ActiveProduct[];
  },
  ["active-products"],
  { tags: ["products"], revalidate: 600 },
);

export const getActiveProducts = cache((): Promise<ActiveProduct[]> =>
  loadActiveProducts(),
);
