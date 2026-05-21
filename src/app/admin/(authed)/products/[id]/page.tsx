import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/admin/TopBar";
import { Card } from "@/components/admin/Card";
import { ProductEditForm } from "./ProductEditForm";
import { ImageManager } from "./ImageManager";

export const dynamic = "force-dynamic";

export default async function ProductEditPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createAdminClient();
  const { data: product, error } = await supabase
    .from("products")
    .select(
      "id, handle, sku_base, product_name, maker, category_l1, category_l2, category_l3, description_short, description_long, msrp, msrp_incl_tax, status, created_at, updated_at",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (error || !product) {
    notFound();
  }

  const { count: specsCount } = await supabase
    .from("product_specs")
    .select("*", { count: "exact", head: true })
    .eq("product_id", product.id);
  const { count: variantsCount } = await supabase
    .from("variants")
    .select("*", { count: "exact", head: true })
    .eq("product_id", product.id);

  const { data: images } = await supabase
    .from("product_images")
    .select("id, url, alt_text, is_primary, sort_order")
    .eq("product_id", product.id)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true });

  return (
    <>
      <TopBar title="商品編集" />
      <div className="flex flex-col gap-5 p-8">
        <div className="text-admin-xs text-admin-inkMute">
          <Link
            href="/admin/products"
            className="underline-offset-2 hover:underline"
          >
            ← 商品マスタ一覧に戻る
          </Link>
        </div>

        <Card title={`商品画像（${images?.length ?? 0} 枚）`}>
          <ImageManager
            productId={product.id}
            images={(images ?? []).map((i) => ({
              id: i.id,
              url: i.url,
              alt_text: i.alt_text,
              is_primary: i.is_primary === true,
              sort_order: i.sort_order ?? 0,
            }))}
          />
        </Card>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
          <Card title="基本情報">
            <ProductEditForm
              id={product.id}
              initial={{
                productName: product.product_name,
                status: product.status,
                maker: product.maker ?? "",
                categoryL1: product.category_l1 ?? "",
                categoryL2: product.category_l2 ?? "",
                categoryL3: product.category_l3 ?? "",
                descriptionShort: product.description_short ?? "",
                descriptionLong: product.description_long ?? "",
              }}
            />
          </Card>

          <div className="flex flex-col gap-5">
            <Card title="メタ情報">
              <dl className="grid grid-cols-[110px_1fr] gap-y-3 text-admin-sm">
                <dt className="text-admin-inkSub">handle</dt>
                <dd className="font-dm text-admin-ink">{product.handle}</dd>
                <dt className="text-admin-inkSub">SKU base</dt>
                <dd className="font-dm text-admin-ink">{product.sku_base}</dd>
                <dt className="text-admin-inkSub">希望小売 (税抜)</dt>
                <dd className="text-admin-ink">
                  {product.msrp != null
                    ? `¥${product.msrp.toLocaleString("ja-JP")}`
                    : "—"}
                </dd>
                <dt className="text-admin-inkSub">バリアント</dt>
                <dd className="text-admin-ink">{variantsCount ?? 0} 件</dd>
                <dt className="text-admin-inkSub">スペック</dt>
                <dd className="text-admin-ink">{specsCount ?? 0} 行</dd>
                <dt className="text-admin-inkSub">作成日時</dt>
                <dd className="text-admin-ink">
                  {new Date(product.created_at).toLocaleString("ja-JP")}
                </dd>
                <dt className="text-admin-inkSub">更新日時</dt>
                <dd className="text-admin-ink">
                  {new Date(product.updated_at).toLocaleString("ja-JP")}
                </dd>
              </dl>
            </Card>

            <Card title="プレビュー">
              <p className="mb-3 text-admin-xs text-admin-inkMute">
                公開サイトでの見え方を新しいタブで開く
              </p>
              <Link
                href={`/products/${product.handle}`}
                target="_blank"
                rel="noopener"
                className="flex min-h-10 w-full items-center justify-center rounded-md border border-admin-line bg-admin-surface text-admin-sm font-medium text-admin-ink hover:bg-admin-surfaceAlt"
              >
                公開ページを開く →
              </Link>
              {product.status !== "active" && (
                <p className="mt-3 text-admin-xs text-admin-warning">
                  ※ 現在 active ではないため、公開ページでは 404 になります。
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
