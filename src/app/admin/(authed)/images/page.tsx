import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/admin/TopBar";
import { Card } from "@/components/admin/Card";
import { ImageRowActions } from "./ImageRowActions";

export const dynamic = "force-dynamic";

type ProductRef = {
  sku_base: string;
  product_name: string;
  handle: string;
} | null;

type ImageRow = {
  id: string;
  url: string;
  is_primary: boolean | null;
  created_at: string;
  product_id: string | null;
  sku_ref: string | null;
  products: ProductRef;
};

type JobRow = {
  id: string;
  filename: string | null;
  uploader_name: string | null;
  total_rows: number | null;
  registered: number | null;
  unlinked: number | null;
  skipped: number | null;
  failed: number | null;
  created_at: string;
};

export default async function ImagesAdminPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const supabase = createAdminClient();
  const q = (searchParams.q ?? "").trim().toLowerCase();

  const [{ data: imgData, error }, { data: jobData }] = await Promise.all([
    supabase
      .from("product_images")
      .select(
        "id, url, is_primary, created_at, product_id, sku_ref, products(sku_base, product_name, handle)",
      )
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("image_import_jobs")
      .select(
        "id, filename, uploader_name, total_rows, registered, unlinked, skipped, failed, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const allRows = (imgData ?? []) as unknown as ImageRow[];
  const rows = q
    ? allRows.filter((r) => {
        const hay = [
          r.products?.sku_base,
          r.products?.product_name,
          r.products?.handle,
          r.sku_ref,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
    : allRows;
  const jobs = (jobData ?? []) as JobRow[];

  return (
    <>
      <TopBar title="画像管理" />
      <div className="flex flex-col gap-5 p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-admin-sm text-admin-inkSub">
            登録済み画像の一覧（新しい順・最大 500 件）。型番・画像URL・プレビューを確認し、必要なら差し替えできます。
          </p>
          <Link
            href="/admin/image-import"
            className="flex min-h-11 items-center rounded-md bg-admin-navy px-5 text-admin-sm font-bold text-white hover:bg-admin-navyHover"
          >
            + 画像を一括登録
          </Link>
        </div>

        {/* アップ履歴 */}
        {jobs.length > 0 && (
          <Card title="アップ履歴">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-admin-lineLight text-left text-admin-xs text-admin-inkMute">
                    <th className="py-2 font-medium">日時</th>
                    <th className="py-2 font-medium">ファイル</th>
                    <th className="py-2 font-medium">実行者</th>
                    <th className="py-2 font-medium">結果（登録/型番なし/スキップ/失敗）</th>
                    <th className="py-2 font-medium">DL</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j) => (
                    <tr
                      key={j.id}
                      className="border-b border-admin-lineLight last:border-0"
                    >
                      <td className="py-2.5 text-admin-xs text-admin-inkMute">
                        {new Date(j.created_at).toLocaleString("ja-JP")}
                      </td>
                      <td className="py-2.5 text-admin-sm text-admin-ink">
                        {j.filename ?? "—"}
                      </td>
                      <td className="py-2.5 text-admin-sm text-admin-inkSub">
                        {j.uploader_name ?? "—"}
                      </td>
                      <td className="py-2.5 font-dm text-admin-sm">
                        <span className="text-admin-success">{j.registered ?? 0}</span>
                        {" / "}
                        <span className="text-admin-info">{j.unlinked ?? 0}</span>
                        {" / "}
                        <span className="text-admin-neutral">{j.skipped ?? 0}</span>
                        {" / "}
                        <span className="text-admin-danger">{j.failed ?? 0}</span>
                      </td>
                      <td className="py-2.5">
                        <a
                          href={`/admin/images/history/${j.id}/download`}
                          className="rounded border border-admin-line bg-admin-surface px-3 py-1.5 text-admin-xs font-medium text-admin-ink hover:bg-admin-surfaceAlt"
                        >
                          結果CSV
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <form action="/admin/images" className="flex items-center gap-2">
          <input
            type="search"
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="型番・商品名・handle で検索"
            className="block min-h-10 flex-1 rounded-md border border-admin-line bg-admin-surface px-3 text-admin-sm outline-none focus:border-admin-navy md:max-w-md"
          />
          <button
            type="submit"
            className="flex min-h-10 items-center rounded-md border border-admin-line bg-admin-surface px-4 text-admin-sm font-medium text-admin-ink hover:bg-admin-surfaceAlt"
          >
            検索
          </button>
          {searchParams.q && (
            <Link
              href="/admin/images"
              className="text-admin-xs text-admin-inkMute underline-offset-2 hover:underline"
            >
              クリア
            </Link>
          )}
        </form>

        <Card title={`画像一覧（${rows.length} 件）`}>
          {error ? (
            <p className="py-8 text-center text-admin-sm text-admin-danger">
              取得エラー: {error.message}
            </p>
          ) : rows.length === 0 ? (
            <p className="py-12 text-center text-admin-sm text-admin-inkSub">
              {q
                ? "該当する画像がありません。"
                : "まだ登録された画像がありません。「画像を一括登録」または商品編集から登録してください。"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-admin-lineLight text-left text-admin-xs text-admin-inkMute">
                    <th className="py-2 font-medium">プレビュー</th>
                    <th className="py-2 font-medium">型番 / 商品名</th>
                    <th className="py-2 font-medium">画像URL</th>
                    <th className="py-2 font-medium">登録日時</th>
                    <th className="py-2 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-admin-lineLight align-top last:border-0"
                    >
                      <td className="py-3 pr-3">
                        <div className="relative h-16 w-16 overflow-hidden rounded border border-admin-line bg-admin-surfaceAlt">
                          <Image
                            src={r.url}
                            alt={r.products?.product_name ?? r.sku_ref ?? ""}
                            fill
                            sizes="64px"
                            className="object-contain"
                          />
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-dm text-admin-sm font-medium text-admin-ink">
                            {r.products?.sku_base ?? r.sku_ref ?? "—"}
                          </span>
                          {r.is_primary && (
                            <span className="rounded bg-admin-successBg px-1.5 py-0.5 text-[10px] font-bold text-admin-success">
                              メイン
                            </span>
                          )}
                          {!r.product_id && (
                            <span className="rounded bg-admin-warningBg px-1.5 py-0.5 text-[10px] font-bold text-admin-warning">
                              商品未登録
                            </span>
                          )}
                        </div>
                        <div className="text-admin-xs text-admin-inkSub">
                          {r.products ? (
                            <Link
                              href={`/admin/products/${r.product_id}`}
                              className="underline-offset-2 hover:underline"
                            >
                              {r.products.product_name}
                            </Link>
                          ) : (
                            "型番なしで保存（商品が登録されると紐付け可）"
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block max-w-[260px] truncate font-dm text-admin-xs text-admin-info underline-offset-2 hover:underline"
                          title={r.url}
                        >
                          {r.url}
                        </a>
                      </td>
                      <td className="py-3 pr-3 text-admin-xs text-admin-inkMute">
                        {new Date(r.created_at).toLocaleString("ja-JP")}
                      </td>
                      <td className="py-3">
                        <ImageRowActions
                          imageId={r.id}
                          isPrimary={r.is_primary === true}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
