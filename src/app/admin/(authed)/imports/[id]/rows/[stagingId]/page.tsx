import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/admin/TopBar";
import { Card } from "@/components/admin/Card";
import { RowEditForm } from "./RowEditForm";

export const dynamic = "force-dynamic";

export default async function RowEditPage({
  params,
}: {
  params: { id: string; stagingId: string };
}) {
  const supabase = createAdminClient();

  const { data: row } = await supabase
    .from("products_staging")
    .select(
      "id, handle, sku_base, product_name, maker, category_l1, category_l2, category_l3, msrp, msrp_incl_tax, status, description_short, description_long",
    )
    .eq("id", params.stagingId)
    .eq("import_job_id", params.id)
    .maybeSingle();

  if (!row) notFound();

  const { data: rowErrors } = await supabase
    .from("import_errors")
    .select("severity, error_code, field_name, message, suggestion")
    .eq("import_job_id", params.id)
    .eq("staging_product_id", row.id)
    .order("severity");

  return (
    <>
      <TopBar title="行修正" />
      <div className="flex flex-col gap-5 p-8">
        <Link
          href={`/admin/imports/${params.id}`}
          className="text-admin-xs text-admin-inkMute underline-offset-2 hover:underline"
        >
          ← ジョブ詳細に戻る
        </Link>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
          <Card title={row.product_name ?? row.handle}>
            <RowEditForm
              jobId={params.id}
              stagingId={row.id}
              initial={{
                handle: row.handle,
                product_name: row.product_name ?? "",
                maker: row.maker ?? "",
                category_l1: row.category_l1 ?? "",
                category_l2: row.category_l2 ?? "",
                category_l3: row.category_l3 ?? "",
                msrp_incl_tax: row.msrp_incl_tax != null ? String(row.msrp_incl_tax) : "",
                status: row.status ?? "draft",
                description_short: row.description_short ?? "",
              }}
            />
          </Card>

          <div className="flex flex-col gap-5">
            <Card title="この行の問題">
              {(rowErrors?.length ?? 0) === 0 ? (
                <p className="py-4 text-center text-admin-sm text-admin-success">
                  ✓ 問題なし
                </p>
              ) : (
                <div className="grid gap-3">
                  {(rowErrors ?? []).map((e, i) => (
                    <div
                      key={i}
                      className={`rounded border p-2.5 ${
                        e.severity === "error"
                          ? "border-admin-danger/30 bg-admin-dangerBg"
                          : "border-admin-warning/30 bg-admin-warningBg"
                      }`}
                    >
                      <div
                        className={`font-dm text-admin-xs ${
                          e.severity === "error"
                            ? "text-admin-danger"
                            : "text-admin-warning"
                        }`}
                      >
                        {e.error_code}
                        {e.field_name && ` / ${e.field_name}`}
                      </div>
                      <div className="text-admin-sm text-admin-ink">{e.message}</div>
                      {e.suggestion && (
                        <div className="mt-1 text-admin-xs text-admin-inkSub">
                          💡 {e.suggestion}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="メタ情報">
              <dl className="grid grid-cols-[100px_1fr] gap-y-2 text-admin-xs">
                <dt className="text-admin-inkSub">SKU base</dt>
                <dd className="font-dm text-admin-ink">{row.sku_base}</dd>
                <dt className="text-admin-inkSub">税抜価格</dt>
                <dd className="text-admin-ink">
                  {row.msrp != null
                    ? `¥${row.msrp.toLocaleString("ja-JP")}`
                    : "—"}
                </dd>
              </dl>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
