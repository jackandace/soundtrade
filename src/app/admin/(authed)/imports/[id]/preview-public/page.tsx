import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/admin/TopBar";
import { ImagePlaceholder } from "@/components/public/ImagePlaceholder";
import { QuoteLabel } from "@/components/public/QuoteLabel";

export const dynamic = "force-dynamic";

export default async function PreviewPublicPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createAdminClient();
  const { data: job } = await supabase
    .from("import_jobs")
    .select("id, source_filename")
    .eq("id", params.id)
    .maybeSingle();
  if (!job) notFound();

  // active になる商品だけ表示（公開サイトに出る予定のもの）
  const { data: rows } = await supabase
    .from("products_staging")
    .select("id, handle, product_name, category_l1, category_l3, status")
    .eq("import_job_id", params.id)
    .order("handle")
    .limit(300);

  const visible = (rows ?? []).filter((r) => r.status === "active");
  const drafts = (rows ?? []).filter((r) => r.status !== "active");

  return (
    <>
      <TopBar title="擬似プレビュー" />
      <div className="flex flex-col gap-5 p-8">
        <div className="flex items-center justify-between">
          <Link
            href={`/admin/imports/${params.id}`}
            className="text-admin-xs text-admin-inkMute underline-offset-2 hover:underline"
          >
            ← ジョブ詳細に戻る
          </Link>
          <div className="text-admin-xs text-admin-inkMute">
            {job.source_filename}
          </div>
        </div>

        <div className="rounded-md border border-admin-info/30 bg-admin-infoBg p-4 text-admin-sm">
          <div className="mb-1 flex items-center gap-2 font-bold text-admin-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            このページは「反映後に公開サイトでどう見えるか」のプレビューです
          </div>
          <p className="text-admin-ink">
            <strong>{visible.length} 商品</strong>が active 扱いで公開予定。{drafts.length} 商品は draft / archived のため公開サイトには出ません。
          </p>
        </div>

        {/* moheim 風の公開カタログをそのまま再現 */}
        <div className="overflow-hidden rounded-lg border border-admin-line">
          <div className="border-b border-admin-line bg-admin-surfaceAlt px-5 py-3 text-admin-xs text-admin-inkMute">
            公開サイト風プレビュー（クリックは無効です）
          </div>
          <div className="bg-ivory px-5 py-8">
            {visible.length === 0 ? (
              <p className="py-12 text-center text-admin-sm text-admin-inkSub">
                公開対象の商品がありません。
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 md:gap-10">
                {visible.slice(0, 200).map((p) => (
                  <PreviewCard
                    key={p.id}
                    productName={p.product_name ?? "(無名)"}
                    handle={p.handle}
                    categoryL1={p.category_l1}
                    categoryL3={p.category_l3}
                  />
                ))}
              </div>
            )}
            {visible.length > 200 && (
              <p className="mt-6 text-center text-admin-xs text-admin-inkMute">
                ...残り {visible.length - 200} 件は省略
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function PreviewCard({
  productName,
  handle,
  categoryL1,
  categoryL3,
}: {
  productName: string;
  handle: string;
  categoryL1: string | null;
  categoryL3: string | null;
}) {
  return (
    <div className="block">
      <div className="mb-3.5">
        <ImagePlaceholder label={productName} />
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
        <span className="font-dm text-[10px] text-muted">{handle}</span>
      </div>
    </div>
  );
}
