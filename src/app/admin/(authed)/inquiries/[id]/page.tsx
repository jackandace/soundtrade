import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/admin/TopBar";
import { Card } from "@/components/admin/Card";
import { InquiryEditForm } from "./InquiryEditForm";

export const dynamic = "force-dynamic";

export default async function InquiryDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createAdminClient();
  const { data: inquiry, error } = await supabase
    .from("inquiries")
    .select(
      "id, inquiry_number, status, customer_id, company_name, contact_name, email, phone, desired_delivery, message, quoted_amount, quoted_at, internal_notes, created_at, updated_at",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (error || !inquiry) {
    notFound();
  }

  const { data: items } = await supabase
    .from("inquiry_items")
    .select("id, product_name, product_handle, quantity")
    .eq("inquiry_id", inquiry.id);

  return (
    <>
      <TopBar title="見積依頼 詳細" />
      <div className="flex flex-col gap-5 p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            href="/admin/inquiries"
            className="text-admin-xs text-admin-inkMute underline-offset-2 hover:underline"
          >
            ← 見積依頼一覧に戻る
          </Link>
          {inquiry.customer_id && (
            <Link
              href={`/admin/customers/${inquiry.customer_id}`}
              className="flex min-h-9 items-center gap-1.5 rounded-md border border-admin-line px-3 text-admin-sm font-medium text-admin-ink hover:bg-admin-surfaceAlt"
            >
              この顧客の履歴・ブロック設定を見る →
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-5">
            <Card title={`受付番号 ${inquiry.inquiry_number}`}>
              <dl className="grid grid-cols-[140px_1fr] gap-y-3 text-admin-sm">
                <Dt>会社名 / 屋号</Dt>
                <Dd>{inquiry.company_name}</Dd>
                <Dt>ご担当者</Dt>
                <Dd>{inquiry.contact_name ?? "—"}</Dd>
                <Dt>メールアドレス</Dt>
                <Dd>
                  <a
                    href={`mailto:${inquiry.email}`}
                    className="text-admin-info underline-offset-2 hover:underline"
                  >
                    {inquiry.email}
                  </a>
                </Dd>
                <Dt>電話番号</Dt>
                <Dd>{inquiry.phone ?? "—"}</Dd>
                <Dt>希望納期</Dt>
                <Dd>{inquiry.desired_delivery ?? "—"}</Dd>
                <Dt>受付日時</Dt>
                <Dd>
                  {new Date(inquiry.created_at).toLocaleString("ja-JP")}
                </Dd>
                {inquiry.message && (
                  <>
                    <Dt>ご要望・備考</Dt>
                    <Dd className="whitespace-pre-wrap">{inquiry.message}</Dd>
                  </>
                )}
              </dl>
            </Card>

            <Card title={`依頼商品 (${items?.length ?? 0} 商品)`}>
              {(items?.length ?? 0) === 0 ? (
                <p className="py-4 text-admin-sm text-admin-inkSub">
                  商品情報がありません。
                </p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-admin-lineLight text-left text-admin-xs text-admin-inkMute">
                      <th className="py-2 font-medium">商品名</th>
                      <th className="py-2 font-medium">handle</th>
                      <th className="py-2 text-right font-medium">数量</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(items ?? []).map((it) => (
                      <tr
                        key={it.id}
                        className="border-b border-admin-lineLight last:border-0"
                      >
                        <td className="py-3 text-admin-sm text-admin-ink">
                          {it.product_handle ? (
                            <Link
                              href={`/products/${it.product_handle}`}
                              className="underline-offset-2 hover:underline"
                              target="_blank"
                            >
                              {it.product_name}
                            </Link>
                          ) : (
                            it.product_name
                          )}
                        </td>
                        <td className="py-3 font-dm text-admin-xs text-admin-inkMute">
                          {it.product_handle ?? "—"}
                        </td>
                        <td className="py-3 text-right text-admin-sm">
                          ×{it.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>

          <InquiryEditForm
            id={inquiry.id}
            initialStatus={inquiry.status}
            initialInternalNotes={inquiry.internal_notes ?? ""}
            initialQuotedAmount={
              inquiry.quoted_amount != null ? String(inquiry.quoted_amount) : ""
            }
            quotedAt={inquiry.quoted_at}
            updatedAt={inquiry.updated_at}
          />
        </div>
      </div>
    </>
  );
}

function Dt({ children }: { children: React.ReactNode }) {
  return <dt className="text-admin-inkSub">{children}</dt>;
}
function Dd({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <dd className={`text-admin-ink ${className}`}>{children}</dd>;
}
