import { Container } from "@/components/public/Container";

// カタログ読み込み中のスケルトン（ストリーミングで即時表示し体感速度を上げる）
export default function CatalogLoading() {
  return (
    <div className="min-h-[70vh] bg-ivory">
      <Container className="pb-16 pt-8 md:pb-24 md:pt-16">
        <div className="mb-5 h-3 w-40 animate-pulse rounded-sm bg-line md:mb-8" />
        <div className="mb-3 h-8 w-56 animate-pulse rounded-sm bg-line" />
        <div className="mb-6 h-3 w-32 animate-pulse rounded-sm bg-line" />
        <div className="mb-8 h-11 w-full max-w-xl animate-pulse rounded-sm bg-line" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr] md:gap-12">
          <div className="hidden flex-col gap-2 md:flex">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 w-full animate-pulse rounded-sm bg-line" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 md:gap-8">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i}>
                <div className="mb-3.5 aspect-square w-full animate-pulse rounded-sm bg-line" />
                <div className="mb-2 h-3 w-3/4 animate-pulse rounded-sm bg-line" />
                <div className="h-3 w-1/2 animate-pulse rounded-sm bg-line" />
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
