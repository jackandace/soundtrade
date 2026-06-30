import { Hero } from "@/components/public/Hero";
import { CategoryGrid } from "@/components/public/CategoryGrid";
import { FeaturedProducts } from "@/components/public/FeaturedProducts";
import { HowItWorks } from "@/components/public/HowItWorks";

// ISR: CDN キャッシュ + 5分ごとに再生成（管理画面の更新時は on-demand 再検証で即時反映）
export const revalidate = 300;

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryGrid />
      <FeaturedProducts />
      <HowItWorks />
    </>
  );
}
