"use client";

import { useState } from "react";
import { useCart } from "@/contexts/cart-context";

type Props = {
  productName: string;
  handle: string;
  categoryL1: string | null;
  categoryL3: string | null;
};

export function AddToCartForm({
  productName,
  handle,
  categoryL1,
  categoryL3,
}: Props) {
  const { addItem, hasItem, isMounted } = useCart();
  const [qty, setQty] = useState(1);

  const inCart = isMounted && hasItem(handle);

  const onAdd = () => {
    addItem({ productName, handle, categoryL1, categoryL3 }, qty);
  };

  return (
    <div className="border border-line bg-white p-5 md:p-6">
      <div className="mb-1.5 flex items-center gap-2 text-base font-medium text-sumi md:text-[17px]">
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#B8956A"
          strokeWidth="1.7"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        見積をご案内します
      </div>
      <p className="mb-5 text-xs leading-relaxed text-sumi-light">
        卸価格はお取引内容・数量に応じて個別にご案内しております。
        数量を選んで見積カートに追加し、まとめて見積依頼へお進みください。
      </p>

      <div className="mb-4 flex items-center gap-3.5">
        <span className="text-[13px] text-sumi-light">数量</span>
        <div className="flex border border-line-mid">
          <button
            type="button"
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="h-11 w-11 bg-ivory text-lg text-sumi"
            aria-label="数量を減らす"
          >
            −
          </button>
          <div className="flex w-14 items-center justify-center border-x border-line text-[15px] text-sumi">
            {qty}
          </div>
          <button
            type="button"
            onClick={() => setQty(qty + 1)}
            className="h-11 w-11 bg-ivory text-lg text-sumi"
            aria-label="数量を増やす"
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onAdd}
        disabled={inCart}
        className={`flex min-h-[54px] w-full items-center justify-center gap-2 border text-[15px] font-medium tracking-wider transition-opacity ${
          inCart
            ? "cursor-default border-line-mid bg-beige text-sumi-light"
            : "border-sumi bg-sumi text-white hover:opacity-90"
        }`}
      >
        {!inCart && (
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.8"
          >
            <path d="M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
            <circle cx="9" cy="20" r="1.5" />
            <circle cx="18" cy="20" r="1.5" />
          </svg>
        )}
        {inCart ? "見積カートに追加済み" : "見積カートに追加する"}
      </button>
    </div>
  );
}
