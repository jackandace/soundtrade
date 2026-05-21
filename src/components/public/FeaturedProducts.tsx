import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { pickPrimaryImage } from "@/lib/product-images";
import { Container } from "./Container";
import { ProductCard } from "./ProductCard";

export async function FeaturedProducts() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "product_name, handle, category_l2, category_l3, product_images(url, is_primary, sort_order)",
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(4);

  return (
    <section className="border-t border-line bg-ivory">
      <Container className="py-16 md:py-24">
        <div className="mb-8 flex items-end justify-between md:mb-14">
          <div>
            <div className="mb-3 font-dm text-[11px] tracking-[0.2em] text-accent">
              FEATURED
            </div>
            <h2 className="text-2xl font-normal tracking-[-0.01em] text-sumi md:text-[30px]">
              注目の商品
            </h2>
          </div>
          <Link
            href="/catalog"
            className="whitespace-nowrap border-b border-sumi pb-0.5 text-[13px] tracking-wider text-sumi"
          >
            すべて見る
          </Link>
        </div>
        {error ? (
          <p className="text-sm text-err">
            商品の取得に失敗しました: {error.message}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-10">
            {(data ?? []).map((p) => (
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
      </Container>
    </section>
  );
}
