import Link from "next/link";
import { Container } from "./Container";
import { ImagePlaceholder } from "./ImagePlaceholder";

const CATEGORIES = [
  { id: "clarinet", jp: "クラリネット", en: "Clarinet" },
  { id: "saxophone", jp: "サクソフォン", en: "Saxophone" },
  { id: "trumpet", jp: "トランペット", en: "Trumpet" },
  { id: "flute", jp: "フルート", en: "Flute" },
  { id: "horn", jp: "ホルン", en: "Horn" },
  { id: "trombone", jp: "トロンボーン", en: "Trombone" },
  { id: "recorder", jp: "リコーダー", en: "Recorder" },
  { id: "doublereed", jp: "ダブルリード", en: "Double Reed" },
];

export function CategoryGrid() {
  return (
    <section className="border-t border-line bg-white">
      <Container className="py-16 md:py-24">
        <div className="mb-9 md:mb-14">
          <div className="mb-3 font-dm text-[11px] tracking-[0.2em] text-accent">
            CATEGORY
          </div>
          <h2 className="text-2xl font-normal tracking-[-0.01em] text-sumi md:text-[30px]">
            取扱カテゴリ
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              href={`/catalog?category=${c.id}`}
              className="flex flex-col items-center gap-3 bg-ivory px-3.5 py-6 transition-opacity duration-300 hover:opacity-75 md:px-6 md:py-9"
            >
              <div className="w-[60px] md:w-20">
                <ImagePlaceholder />
              </div>
              <div className="text-center">
                <div className="text-[13px] font-medium text-sumi md:text-sm">
                  {c.jp}
                </div>
                <div className="mt-0.5 font-dm text-[9px] tracking-[0.1em] text-muted">
                  {c.en.toUpperCase()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
