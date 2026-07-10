import Link from "next/link";
import Image from "next/image";
import { Container } from "./Container";
import { ImagePlaceholder } from "./ImagePlaceholder";

// メインビジュアル。未設定ならプレースホルダーにフォールバック。
const HERO_IMAGE: string | undefined = "/images/hero-main.png";

export function Hero() {
  return (
    <section className="bg-ivory">
      <Container className="grid grid-cols-1 items-center gap-9 py-11 md:grid-cols-[1.05fr_0.95fr] md:gap-[72px] md:py-24">
        <div className="order-2 md:order-1">
          <h1 className="mb-6 text-[26px] font-light leading-[1.5] tracking-[-0.02em] text-sumi md:text-[40px]">
            楽器・楽譜・音響機器の
            <br />
            仕入れならミツエス
          </h1>
          <p className="mb-8 max-w-[480px] text-sm leading-loose text-sumi-light md:text-[15px]">
            管楽器・弦楽器・打楽器——主要メーカーの楽器や関連アイテムをまとめて取り扱う卸プラットフォーム。
            楽器店、レンタル事業者、各種小売店、オフィスなどの法人様や楽器の講師等をされている個人事業主様に、確かな品質と価格でお応えします。
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/catalog"
              className="flex-1 border border-sumi bg-sumi px-7 py-4 text-center text-sm tracking-wider text-white md:flex-none md:px-9"
            >
              カタログを見る
            </Link>
            <a
              href="#flow"
              className="flex-1 border border-line-mid bg-transparent px-7 py-4 text-center text-sm tracking-wider text-sumi md:flex-none md:px-9"
            >
              ご利用の流れ
            </a>
          </div>
        </div>
        <div className="order-1 md:order-2">
          {HERO_IMAGE ? (
            <div className="relative aspect-[4/3] overflow-hidden border border-line bg-white md:aspect-square">
              <Image
                src={HERO_IMAGE}
                alt="楽器卸のミツエス メインビジュアル"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 600px"
                className="object-cover"
              />
            </div>
          ) : (
            <ImagePlaceholder
              label="メインビジュアル / 楽器が一堂に並ぶ卸倉庫の実写真が入ります"
              aspectClass="aspect-[4/3] md:aspect-square"
              big
            />
          )}
        </div>
      </Container>
    </section>
  );
}
