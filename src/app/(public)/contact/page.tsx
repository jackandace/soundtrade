"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/public/Container";
import { loadBuyerProfile, saveBuyerProfile } from "@/lib/buyer-profile";
import { submitContact, type SubmitContactResult } from "./actions";

const INPUT_CLASSES =
  "w-full min-h-[48px] border border-line-mid bg-white p-3.5 text-[15px] text-sumi outline-none focus:border-sumi";

export default function ContactPage() {
  return (
    <Suspense fallback={<ContactShell />}>
      <ContactForm />
    </Suspense>
  );
}

function ContactShell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-[70vh] bg-ivory">
      <Container className="pb-16 pt-8 md:pb-24 md:pt-16">
        <div className="mb-5 text-xs tracking-wider text-muted md:mb-8">
          ホーム ／ お問い合わせ
        </div>
        <h1 className="mb-2 text-[26px] font-light tracking-[-0.01em] text-sumi md:text-[34px]">
          掲載外商品のお問い合わせ
        </h1>
        <p className="mb-8 max-w-[680px] text-[13px] leading-relaxed text-sumi-light">
          カタログに掲載のない商品も、お取り寄せできる場合があります。
          ご希望の商品名や品番をご記入のうえ、お気軽にお問い合わせください。
          担当者より2営業日以内にご連絡いたします。
        </p>
        {children}
      </Container>
    </div>
  );
}

function ContactForm() {
  const params = useSearchParams();
  const initialProduct = params.get("q") ?? "";

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [productName, setProductName] = useState(initialProduct);
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitContactResult | null>(null);

  // 前回入力した会社情報を自動補完
  useEffect(() => {
    const p = loadBuyerProfile();
    if (p.companyName) setCompanyName(p.companyName);
    if (p.contactName) setContactName(p.contactName);
    if (p.email) setEmail(p.email);
    if (p.phone) setPhone(p.phone);
  }, []);

  if (result?.ok) {
    return (
      <CompleteView
        inquiryNumber={result.inquiryNumber}
        mailSent={result.mailSent}
      />
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const r = await submitContact({
      companyName,
      contactName,
      email,
      phone,
      productName,
      quantity,
      message,
    });
    if (r.ok) saveBuyerProfile({ companyName, contactName, email, phone });
    setResult(r);
    setSubmitting(false);
  };

  return (
    <ContactShell>
      <form
        onSubmit={onSubmit}
        className="max-w-[680px] border border-line bg-white p-6 md:p-10"
      >
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
          <Field
            label="お探しの商品名 / 品番"
            placeholder="例: YAMAHA YCL-650、ギター各種 など"
            value={productName}
            onChange={setProductName}
          />
          <div>
            <FieldLabel label="希望数量（任意）" />
            <input
              type="text"
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="未入力可"
              className={INPUT_CLASSES}
            />
          </div>
          <div>
            <FieldLabel label="お問い合わせ内容" required />
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="お探しの商品の詳細、希望納期、ご予算など、分かる範囲でご記入ください"
              className={`${INPUT_CLASSES} resize-y`}
              required
            />
          </div>

          {result && !result.ok && (
            <p className="text-center text-xs text-err">
              送信に失敗しました: {result.error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="min-h-[52px] w-full border border-sumi bg-sumi text-sm tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "送信中..." : "この内容で問い合わせる"}
          </button>
          <p className="text-center text-[11px] leading-relaxed text-muted">
            送信により
            <span className="border-b border-muted">プライバシーポリシー</span>
            に同意したものとみなします
          </p>
        </div>
      </form>
    </ContactShell>
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
      {required && <span className="ml-2 text-[11px] text-err">※必須</span>}
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
          お問い合わせを受け付けました
        </h1>
        <p className="mb-2 text-sm leading-loose text-sumi-light">
          受付番号{" "}
          <span className="font-dm font-medium text-sumi">{inquiryNumber}</span>
        </p>
        <p className="mb-9 text-[13px] leading-loose text-sumi-light">
          {mailSent ? (
            <>
              ご入力のメールアドレスに確認メールをお送りしました。
              <br />
              担当者より2営業日以内にご連絡いたします。
            </>
          ) : (
            <>担当者より2営業日以内にご連絡いたします。</>
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
