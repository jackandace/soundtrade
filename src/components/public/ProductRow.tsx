import Link from "next/link";
import Image from "next/image";
import { ImagePlaceholder } from "./ImagePlaceholder";
import { QuoteLabel } from "./QuoteLabel";
import { formatListPrice } from "@/lib/price";

type Props = {
  productName: string;
  handle: string;
  maker: string | null;
  categoryL2: string | null;
  categoryL3: string | null;
  imageUrl?: string | null;
  msrpInclTax?: number | null;
  tags?: string[];
};

export function ProductRow({
  productName,
  handle,
  maker,
  categoryL2,
  categoryL3,
  imageUrl,
  msrpInclTax,
  tags = [],
}: Props) {
  const listPrice = formatListPrice(msrpInclTax);
  return (
    <Link
      href={`/products/${handle}`}
      className="grid grid-cols-[88px_1fr] items-center gap-4 border border-line bg-white p-3 transition-colors duration-300 hover:border-line-mid md:grid-cols-[120px_1fr_auto] md:gap-6 md:p-4"
    >
      <div className="w-[88px] md:w-[120px]">
        {imageUrl ? (
          <div className="relative aspect-square overflow-hidden border border-line bg-white">
            <Image
              src={imageUrl}
              alt={productName}
              fill
              sizes="120px"
              className="object-contain"
            />
          </div>
        ) : (
          <ImagePlaceholder label="" />
        )}
      </div>

      <div className="min-w-0">
        <div className="mb-1 text-[11px] tracking-wider text-muted">
          {[maker, categoryL2].filter(Boolean).join(" / ")}
        </div>
        <div className="mb-1 truncate text-sm font-medium text-sumi md:text-[15px]">
          {productName}
        </div>
        {categoryL3 && (
          <div className="mb-1 truncate text-xs text-sumi-light">
            {categoryL3}
          </div>
        )}
        {tags.length > 0 && (
          <div className="mt-1.5 hidden flex-wrap gap-1.5 md:flex">
            {tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="rounded-sm bg-beige px-2 py-0.5 text-[11px] text-sumi-light"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="col-span-2 flex items-center justify-between gap-4 border-t border-line pt-2 md:col-span-1 md:flex-col md:items-end md:border-0 md:pt-0 md:text-right">
        {listPrice ? (
          <div className="text-sm text-sumi md:text-[15px]">
            <span className="text-[10px] text-muted">定価 </span>
            {listPrice}
          </div>
        ) : (
          <span />
        )}
        <QuoteLabel size="sm" />
      </div>
    </Link>
  );
}
