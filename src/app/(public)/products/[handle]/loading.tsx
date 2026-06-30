import { Container } from "@/components/public/Container";

// 商品詳細 読み込み中のスケルトン
export default function ProductLoading() {
  return (
    <div className="min-h-[70vh] bg-ivory">
      <Container className="pb-16 pt-6 md:pb-24 md:pt-16">
        <div className="mb-6 h-3 w-48 animate-pulse rounded-sm bg-line md:mb-10" />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-14">
          <div className="aspect-square w-full animate-pulse rounded-sm bg-line" />
          <div>
            <div className="mb-3 h-3 w-24 animate-pulse rounded-sm bg-line" />
            <div className="mb-4 h-8 w-3/4 animate-pulse rounded-sm bg-line" />
            <div className="mb-2 h-3 w-1/2 animate-pulse rounded-sm bg-line" />
            <div className="mb-8 h-3 w-1/3 animate-pulse rounded-sm bg-line" />
            <div className="h-12 w-full max-w-xs animate-pulse rounded-sm bg-line" />
          </div>
        </div>
      </Container>
    </div>
  );
}
