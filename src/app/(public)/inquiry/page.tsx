"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/contexts/cart-context";
import { Container } from "@/components/public/Container";
import { submitInquiry, type SubmitInquiryResult } from "./actions";

const INPUT_CLASSES =
  "w-full min-h-[48px] border border-line-mid bg-white p-3.5 text-[15px] text-sumi outline-none focus:border-sumi";

export default function InquiryPage() {
  const { items, isMounted, clear } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitInquiryResult | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [desiredDelivery, setDesiredDelivery] = useState("できるだけ早く");
  const [message, setMessage] = useState("");

  if (result?.ok) {
    return (
      <CompleteView
        inquiryNumber={result.inquiryNumber}
        mailSent={result.mailSent}
      />
    );
  }

  if (isMounted && items.length === 0) {
    return (
      <div className="min-h-[70vh] bg-ivory">
        <Container className="py-24 text-center">
          <p className="mb-6 text-sm text-sumi-light">
            カートに商品がありません。
          </p>
          <Link
            href="/catalog"
            className="inline-block border border-sumi bg-sumi px-9 py-4 text-sm tracking-wider text-white"
          >
            カタログを見る
          </Link>
        </Container>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const r = await submitInquiry({
      companyName,
      contactName,
      email,
      phone,
      desiredDelivery,
      message,
      items: items.map((i) => ({
        handle: i.handle,
        productName: i.productName,
        quantity: i.qty,
      })),
    });
    if (r.ok) clear();
    setResult(r);
    setSubmitting(false);
  };

  return (
    <div className="min-h-[70vh] bg-ivory">
      <Container className="pb-16 pt-8 md:pb-24 md:pt-16">
        <div className="mb-5 text-xs tracking-wider text-muted md:mb-8">
          ホーム ／ 見積カート ／ 見積依頼
        </div>
        <h1 className="mb-8 text-[26px] font-light tracking-[-0.01em] text-sumi md:text-[34px]">
          見積依頼フォーム
        </h1>

        <form
          onSubmit={onSubmit}
          className="grid grid-cols-1 items-start gap-6 md:grid-cols-[1fr_340px] md:gap-14"
        >
          <div className="order-2 border border-line bg-white p-6 md:order-1 md:p-10">
            <div className="grid gap-5">
              <Field
                label="会社名 / 屋号"
                placeholder="株式会社サウンドミュージック"
                required
                value={companyName}
                onChange={setCompanyName}
              />
              <Field
                label="ご担当者名"
                placeholder="山田 太郎"
                required
                value={contactName}
                onChange={setContactName}
              />
              <Field
                label="メールアドレス"
                type="email"
                placeholder="yamada@example.com"
                required
                value={email}
                onChange={setEmail}
              />
              <Field
                label="電話番号"
                type="tel"
                placeholder="03-1234-5678"
                required
                value={phone}
                onChange={setPhone}
              />
              <div>
                <FieldLabel label="希望納期" />
                <select
                  className={INPUT_CLASSES}
                  value={desiredDelivery}
                  onChange={(e) => setDesiredDelivery(e.target.value)}
                >
                  <option>できるだけ早く</option>
                  <option>1ヶ月以内</option>
                  <option>2〜3ヶ月以内</option>
                  <option>未定 / 相談したい</option>
                </select>
              </div>
              <div>
                <FieldLabel label="ご要望・備考" />
                <textarea
                  rows={4}
                  placeholder="数量の相談、納品先のご指定などがあればご記入ください"
                  className={`${INPUT_CLASSES} resize-y`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="order-1 border border-line bg-white p-5 md:order-2 md:p-7">
            <div className="mb-4 text-sm font-medium tracking-wider text-sumi">
              依頼内容（{items.length}商品）
            </div>
            {items.map((item) => (
              <div
                key={item.handle}
                className="mb-2.5 flex justify-between gap-3 text-xs"
              >
                <span className="text-sumi">
                  {item.productName}
                  <span className="text-muted"> ×{item.qty}</span>
                </span>
              </div>
            ))}
            <div className="mt-2 border-t border-line pt-4 text-[11px] leading-relaxed text-sumi-light">
              上記 {items.length} 商品について、担当者よりお見積もりをご案内いたします。
            </div>
            <button
              type="submit"
              disabled={submitting || !isMounted}
              className="mt-5 w-full border border-sumi bg-sumi p-4 text-sm tracking-wider text-white disabled:opacity-50"
            >
              {submitting ? "送信中..." : "この内容で見積を依頼する"}
            </button>
            {result && !result.ok && (
              <p className="mt-3 text-center text-xs text-err">
                送信に失敗しました: {result.error}
              </p>
            )}
            <p className="mt-3.5 text-center text-[11px] leading-relaxed text-muted">
              送信により
              <span className="border-b border-muted">プライバシーポリシー</span>
              に同意したものとみなします
            </p>
          </div>
        </form>
      </Container>
    </div>
  );
}

function FieldLabel({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <div className="mb-2 text-[13px] font-medium text-sumi">
      {label}
      {required && (
        <span className="ml-2 text-[11px] text-err">※必須</span>
      )}
    </div>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
  required,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <input
        type={type}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT_CLASSES}
      />
    </div>
  );
}

function CompleteView({
  inquiryNumber,
  mailSent,
}: {
  inquiryNumber: string;
  mailSent: boolean;
}) {
  return (
    <div className="min-h-[70vh] bg-ivory">
      <div className="mx-auto max-w-[640px] px-5 py-20 text-center md:px-12 md:py-32">
        <div className="mx-auto mb-7 flex h-14 w-14 items-center justify-center rounded-full border-[1.5px] border-stock-in text-2xl text-stock-in">
          ✓
        </div>
        <h1 className="mb-4 text-2xl font-light text-sumi md:text-[28px]">
          見積依頼を受け付けました
        </h1>
        <p className="mb-2 text-sm leading-loose text-sumi-light">
          受付番号{" "}
          <span className="font-dm font-medium text-sumi">
            {inquiryNumber}
          </span>
        </p>
        <p className="mb-9 text-[13px] leading-loose text-sumi-light">
          {mailSent ? (
            <>
              ご入力のメールアドレスに確認メールをお送りしました。
              <br />
              担当者より2営業日以内に見積書をお送りいたします。
            </>
          ) : (
            <>担当者より2営業日以内に見積書をお送りいたします。</>
          )}
        </p>
        <Link
          href="/"
          className="inline-block border border-sumi bg-sumi px-9 py-4 text-sm tracking-wider text-white"
        >
          トップへ戻る
        </Link>
      </div>
    </div>
  );
}
