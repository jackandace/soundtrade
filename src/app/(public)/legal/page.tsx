import type { Metadata } from "next";
import { Container } from "@/components/public/Container";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記",
  description: "特定商取引法に基づく表記。",
  robots: { index: false, follow: true },
};

const ROWS: Array<[string, React.ReactNode]> = [
  ["販売事業者", "株式会社ミツエス"],
  ["運営統括責任者", "佐藤 しげ子"],
  [
    "所在地",
    <>
      〒453-0801
      <br />
      愛知県名古屋市中村区太閤5-9-9
    </>,
  ],
  ["電話番号", "052-451-1161（FAX 052-451-1164）"],
  ["メールアドレス", "satot@mitsuesu.ne.jp"],
  [
    "販売価格",
    "各商品ページに定価（メーカー希望小売価格・税込）を参考表示しています。実際の卸価格は、見積依頼後に個別にご案内いたします。",
  ],
  [
    "商品代金以外の必要料金",
    "消費税、送料、決済手数料等（金額はお見積もり時にご案内します）。",
  ],
  [
    "お支払い方法",
    "お取引内容に応じて、別途お見積もり・ご契約時にご案内いたします。",
  ],
  ["お支払い時期", "ご契約時に取り決めた条件に従います。"],
  [
    "商品の引渡時期",
    "ご注文確定後、別途ご案内する納期にて発送いたします。受注生産品は商材により数ヶ月を要する場合があります。",
  ],
  [
    "返品・交換について",
    "（要確認）卸取引につき、返品・交換の可否および条件は個別のお取引契約によります。詳細は担当者までお問い合わせください。",
  ],
];

export default function LegalPage() {
  return (
    <div className="min-h-[70vh] bg-ivory">
      <Container className="pb-16 pt-8 md:pb-24 md:pt-16">
        <div className="mb-5 text-xs tracking-wider text-muted md:mb-8">
          ホーム ／ 特定商取引法に基づく表記
        </div>
        <h1 className="mb-2 text-[26px] font-light tracking-[-0.01em] text-sumi md:text-[34px]">
          特定商取引法に基づく表記
        </h1>
        <p className="mb-10 max-w-2xl text-[13px] leading-relaxed text-sumi-light">
          当サイトは楽器店・レンタル事業者・各種小売店・教育機関などの法人様および個人事業主様を対象とした、卸取引のためのプラットフォームです。具体的な取引条件は見積依頼後に個別にご案内いたします。
        </p>

        <dl className="max-w-2xl border-t border-line">
          {ROWS.map(([k, v]) => (
            <div
              key={k}
              className="grid grid-cols-1 gap-1 border-b border-line py-4 md:grid-cols-[180px_1fr] md:gap-6"
            >
              <dt className="text-[13px] text-muted">{k}</dt>
              <dd className="text-sm leading-relaxed text-sumi">{v}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </div>
  );
}
