"use client";

import Link from "next/link";
import { useCart } from "@/contexts/cart-context";
import { Container } from "@/components/public/Container";
import { ImagePlaceholder } from "@/components/public/ImagePlaceholder";

export default function CartPage() {
  const { items, totalQty, isMounted, updateQty, removeItem } = useCart();

  if (!isMounted) {
    return (
      <Shell>
        <div className="py-16 text-center text-sm text-sumi-light">
          読み込み中...
        </div>
      </Shell>
    );
  }

  if (items.length === 0) {
    return (
      <Shell>
        <div className="py-16 text-center md:py-20">
          <h1 className="mb-4 text-[26px] font-light text-sumi md:text-[32px]">
            見積カート
          </h1>
          <p className="mb-9 text-sm text-sumi-light">
            カートに商品がありません。
          </p>
          <Link
            href="/catalog"
            className="inline-block border border-sumi bg-sumi px-9 py-4 text-sm tracking-wider text-white"
          >
            カタログを見る
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-5 text-xs tracking-wider text-muted md:mb-8">
        ホーム ／ 見積カート
      </div>
      <h1 className="mb-2 text-[26px] font-light tracking-[-0.01em] text-sumi md:text-[34px]">
        見積カート
      </h1>
      <p className="mb-8 text-[13px] text-sumi-light">
        {items.length} 商品 / 合計 {totalQty} 点
      </p>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[1fr_340px] md:gap-14">
        <div className="border border-line bg-white">
          {items.map((item, i) => (
            <div
              key={item.handle}
              className={`grid grid-cols-[72px_1fr] items-start gap-3.5 p-4 md:grid-cols-[90px_1fr_auto] md:items-center md:gap-6 md:p-6 ${
                i < items.length - 1 ? "border-b border-line" : ""
              }`}
            >
              <div className="w-[72px] md:w-[90px]">
                <ImagePlaceholder />
              </div>
              <div>
                {item.categoryL1 && (
                  <div className="mb-1 text-[11px] text-muted">
                    {item.categoryL1}
                  </div>
                )}
                <div className="mb-1 text-sm font-medium text-sumi">
                  {item.productName}
                </div>
                <div className="text-[13px] text-sumi-light">
                  見積価格をご案内します
                </div>
                <div className="mt-3 flex items-center justify-between md:hidden">
                  <QtyControl
                    value={item.qty}
                    onDec={() => updateQty(item.handle, Math.max(1, item.qty - 1))}
                    onInc={() => updateQty(item.handle, item.qty + 1)}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(item.handle)}
                    className="border-b border-line pb-0.5 text-xs text-muted"
                  >
                    削除
                  </button>
                </div>
              </div>
              <div className="hidden text-right md:block">
                <QtyControl
                  size="sm"
                  value={item.qty}
                  onDec={() => updateQty(item.handle, Math.max(1, item.qty - 1))}
                  onInc={() => updateQty(item.handle, item.qty + 1)}
                />
                <button
                  type="button"
                  onClick={() => removeItem(item.handle)}
                  className="mt-2 border-b border-line pb-0.5 text-[11px] text-muted"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="border border-line bg-white p-5 md:p-7">
          <div className="mb-4 text-sm font-medium tracking-wider text-sumi">
            見積サマリー
          </div>
          <div className="mb-4 flex justify-between border-b border-line pb-4 text-[13px] text-sumi-light">
            <span>商品点数</span>
            <span className="font-medium text-sumi">{totalQty} 点</span>
          </div>
          <p className="mb-4 text-xs leading-relaxed text-sumi-light">
            卸価格はお取引内容・数量に応じて個別にご案内しております。
            下記より見積をご依頼ください。担当者が2営業日以内にお見積もりをお送りします。
          </p>
          <Link
            href="/inquiry"
            className="flex min-h-[56px] w-full items-center justify-center gap-2 border border-sumi bg-sumi p-4 text-[15px] font-medium tracking-wider text-white"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.8"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            見積依頼へ進む
          </Link>
          <Link
            href="/catalog"
            className="mt-3 flex w-full items-center justify-center border border-line-mid bg-transparent p-3.5 text-[13px] tracking-wider text-sumi"
          >
            商品一覧に戻る
          </Link>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[70vh] bg-ivory">
      <Container className="pb-16 pt-8 md:pb-24 md:pt-16">{children}</Container>
    </div>
  );
}

function QtyControl({
  value,
  onDec,
  onInc,
  size = "md",
}: {
  value: number;
  onDec: () => void;
  onInc: () => void;
  size?: "sm" | "md";
}) {
  const btn = size === "sm" ? "h-9 w-9 text-[15px]" : "h-10 w-10 text-base";
  return (
    <div className="inline-flex border border-line-mid">
      <button
        type="button"
        onClick={onDec}
        className={`${btn} bg-white`}
        aria-label="数量を減らす"
      >
        −
      </button>
      <div className="flex w-11 items-center justify-center border-x border-line text-sm">
        {value}
      </div>
      <button
        type="button"
        onClick={onInc}
        className={`${btn} bg-white`}
        aria-label="数量を増やす"
      >
        ＋
      </button>
    </div>
  );
}
