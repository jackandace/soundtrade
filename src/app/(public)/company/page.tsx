import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/public/Container";

export const metadata: Metadata = {
  title: "運営会社",
  description: "楽器卸のミツエスを運営する会社の概要。",
};

const ROWS: Array<[string, React.ReactNode]> = [
  ["社名", "株式会社ミツエス"],
  ["代表者", "新井 貴雄"],
  [
    "本社所在地",
    <>
      〒453-0801
      <br />
      愛知県名古屋市中村区太閤5-9-9 ミツエスビル
      <br />
      <span className="text-[12px] text-muted">
        ※商品の直接受け渡しは行っておりませんので、ご了承ください。
      </span>
    </>,
  ],
  ["電話番号", "052-451-1161"],
  ["FAX", "052-451-1164"],
  ["メール", "contact@mitsuesu-music.com"],
  ["資本金", "1,000万円"],
  ["設立", "1954年"],
  ["事業内容", "楽器、楽譜、音響機器の卸売"],
  ["取引銀行", "北陸銀行 / 三菱UFJ銀行 / 名古屋銀行 / 愛知銀行"],
];

const HISTORY: Array<[string, string]> = [
  ["1947年3月", "サンエス商会設立、楽器及び付属品の販売を開始"],
  ["1953年5月", "株式会社ミツエス商会設立"],
  ["1999年10月", "株式会社ミツエスへ商号変更"],
];

export default function CompanyPage() {
  return (
    <div className="min-h-[70vh] bg-ivory">
      <Container className="pb-16 pt-8 md:pb-24 md:pt-16">
        <div className="mb-5 text-xs tracking-wider text-muted md:mb-8">
          <Link href="/" className="transition-colors hover:text-sumi hover:underline">
            ホーム
          </Link>
          {" ／ 運営会社"}
        </div>
        <h1 className="mb-2 text-[26px] font-light tracking-[-0.01em] text-sumi md:text-[34px]">
          運営会社
        </h1>
        <p className="mb-10 font-dm text-[11px] tracking-[0.2em] text-accent">
          COMPANY
        </p>

        <dl className="max-w-2xl border-t border-line">
          {ROWS.map(([k, v]) => (
            <div
              key={k}
              className="grid grid-cols-1 gap-1 border-b border-line py-4 md:grid-cols-[160px_1fr] md:gap-4"
            >
              <dt className="text-[13px] text-muted">{k}</dt>
              <dd className="text-sm leading-relaxed text-sumi">{v}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mb-5 mt-14 text-xl font-normal text-sumi">沿革</h2>
        <dl className="max-w-2xl border-t border-line">
          {HISTORY.map(([y, t]) => (
            <div
              key={y}
              className="grid grid-cols-1 gap-1 border-b border-line py-4 md:grid-cols-[160px_1fr] md:gap-4"
            >
              <dt className="font-dm text-[13px] text-muted">{y}</dt>
              <dd className="text-sm leading-relaxed text-sumi">{t}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </div>
  );
}
