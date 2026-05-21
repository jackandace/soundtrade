import Link from "next/link";
import Image from "next/image";
import { ImagePlaceholder } from "./ImagePlaceholder";
import { QuoteLabel } from "./QuoteLabel";

type Props = {
  productName: string;
  handle: string;
  categoryL1: string | null;
  categoryL3: string | null;
  imageUrl?: string | null;
};

export function ProductCard({
  productName,
  handle,
  categoryL1,
  categoryL3,
  imageUrl,
}: Props) {
  return (
    <Link
      href={`/products/${handle}`}
      className="block transition-opacity duration-300 hover:opacity-75"
    >
      <div className="mb-3.5">
        {imageUrl ? (
          <div className="relative aspect-square overflow-hidden border border-line bg-white">
            <Image
              src={imageUrl}
              alt={productName}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-contain"
            />
          </div>
        ) : (
          <ImagePlaceholder label={productName} />
        )}
      </div>
      {categoryL1 && (
        <div className="mb-1 text-[11px] tracking-wider text-muted">
          {categoryL1}
        </div>
      )}
      <div className="mb-1 text-sm font-medium leading-relaxed text-sumi">
        {productName}
      </div>
      {categoryL3 && (
        <div className="mb-2.5 text-xs text-sumi-light">{categoryL3}</div>
      )}
      <div className="flex items-center justify-between">
        <QuoteLabel size="sm" />
      </div>
    </Link>
  );
}
