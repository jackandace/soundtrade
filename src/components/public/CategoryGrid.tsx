import Link from "next/link";
import Image from "next/image";
import { catalogHrefL2 } from "@/lib/categories";
import { Container } from "./Container";
import { ImagePlaceholder } from "./ImagePlaceholder";

// トップの「取扱カテゴリ」ショーケース（キュレーション）。
// - name は実際の category_l2 と一致させること（/catalog?l2= のリンク先になる）。
// - image を設定するとその画像を表示、未設定なら自動でプレースホルダー。
//   画像素材が届いたら image に "/images/categories/<slug>.png" を入れるだけ。
const SHOWCASE: Array<{ name: string; en: string; image?: string }> = [
  { name: "フルート", en: "Flute", image: "/images/categories/flute.png" },
  { name: "クラリネット", en: "Clarinet", image: "/images/categories/clarinet.png" },
  { name: "サクソフォン", en: "Saxophone", image: "/images/categories/saxophone.png" },
  { name: "金管楽器", en: "Brass", image: "/images/categories/brass.png" },
  { name: "トロンボーン", en: "Trombone", image: "/images/categories/trombone.png" },
  { name: "ホルン", en: "Horn", image: "/images/categories/horn.png" },
  { name: "リコーダー", en: "Recorder" }, // recorder.png 未着→プレースホルダー
  { name: "鍵盤ハーモニカ", en: "Melodica", image: "/images/categories/melodica.png" },
];

export function CategoryGrid() {
  return (
    <section className="border-t border-line bg-white">
      <Container className="py-16 md:py-24">
        <div className="mb-9 flex items-end justify-between md:mb-14">
          <div>
            <div className="mb-3 font-dm text-[11px] tracking-[0.2em] text-accent">
              CATEGORY
            </div>
            <h2 className="text-2xl font-normal tracking-[-0.01em] text-sumi md:text-[30px]">
              取扱カテゴリ
            </h2>
          </div>
          <Link
            href="/categories"
            className="hidden shrink-0 border-b border-line-mid pb-0.5 text-sm text-sumi-light transition-colors hover:border-sumi hover:text-sumi md:inline-block"
          >
            すべて見る →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
          {SHOWCASE.map((c) => (
            <Link
              key={c.name}
              href={catalogHrefL2(c.name)}
              className="flex flex-col items-center gap-3 bg-ivory px-3.5 py-6 transition-opacity duration-300 hover:opacity-75 md:px-6 md:py-9"
            >
              <div className="w-[60px] md:w-20">
                {c.image ? (
                  <div className="relative aspect-square overflow-hidden border border-line bg-white">
                    <Image
                      src={c.image}
                      alt={c.name}
                      fill
                      sizes="80px"
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <ImagePlaceholder />
                )}
              </div>
              <div className="text-center">
                <div className="text-[13px] font-medium text-sumi md:text-sm">
                  {c.name}
                </div>
                <div className="mt-0.5 font-dm text-[9px] tracking-[0.1em] text-muted">
                  {c.en.toUpperCase()}
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center md:hidden">
          <Link
            href="/categories"
            className="inline-block border border-line-mid px-6 py-3 text-sm text-sumi transition-colors hover:border-sumi"
          >
            すべてのカテゴリを見る →
          </Link>
        </div>
      </Container>
    </section>
  );
}
