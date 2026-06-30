import type { Metadata } from "next";
import { Container } from "@/components/public/Container";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: "楽器卸のミツエスのプライバシーポリシー（個人情報の取り扱い）。",
};

const SECTIONS: Array<{ title: string; body: React.ReactNode }> = [
  {
    title: "1. 事業者情報",
    body: (
      <>
        株式会社ミツエス
        <br />
        〒453-0801 愛知県名古屋市中村区太閤5-9-9
        <br />
        TEL: 052-451-1161 / メール: satot@mitsuesu.ne.jp
      </>
    ),
  },
  {
    title: "2. 取得する個人情報",
    body: "見積依頼・お問い合わせの際にご入力いただく、会社名・屋号、ご担当者名、メールアドレス、電話番号、ご要望の内容等を取得します。",
  },
  {
    title: "3. 利用目的",
    body: "取得した個人情報は、見積回答・商品のご案内・ご連絡・お問い合わせへの対応、および取引に必要な業務の範囲で利用します。これらの目的の範囲を超えて利用することはありません。",
  },
  {
    title: "4. 第三者への提供",
    body: "法令に基づく場合を除き、ご本人の同意なく個人情報を第三者に提供することはありません。",
  },
  {
    title: "5. 安全管理",
    body: "取得した個人情報の漏えい・滅失・毀損を防止するため、適切な安全管理措置を講じます。",
  },
  {
    title: "6. 開示・訂正・削除",
    body: "ご本人からの個人情報の開示・訂正・利用停止・削除のご請求には、ご本人であることを確認のうえ、適切に対応します。下記の窓口までお問い合わせください。",
  },
  {
    title: "7. お問い合わせ窓口",
    body: "個人情報の取り扱いに関するお問い合わせは、satot@mitsuesu.ne.jp までご連絡ください。",
  },
  {
    title: "8. 本ポリシーの変更",
    body: "本ポリシーの内容は、必要に応じて変更することがあります。変更後の内容は本ページに掲載した時点から効力を生じます。",
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-[70vh] bg-ivory">
      <Container className="pb-16 pt-8 md:pb-24 md:pt-16">
        <div className="mb-5 text-xs tracking-wider text-muted md:mb-8">
          ホーム ／ プライバシーポリシー
        </div>
        <h1 className="mb-2 text-[26px] font-light tracking-[-0.01em] text-sumi md:text-[34px]">
          プライバシーポリシー
        </h1>
        <p className="mb-10 max-w-2xl text-[13px] leading-relaxed text-sumi-light">
          株式会社ミツエス（以下「当社」）は、当サイトの運営にあたり、お客様の個人情報を以下の方針に基づき適切に取り扱います。
        </p>

        <div className="max-w-2xl divide-y divide-line border-y border-line">
          {SECTIONS.map((s) => (
            <section key={s.title} className="py-6">
              <h2 className="mb-2 text-base font-medium text-sumi">{s.title}</h2>
              <p className="text-sm leading-relaxed text-sumi-light">{s.body}</p>
            </section>
          ))}
        </div>
      </Container>
    </div>
  );
}
