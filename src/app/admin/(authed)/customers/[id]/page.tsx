import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/admin/TopBar";
import { Card } from "@/components/admin/Card";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { CustomerEditForm } from "./CustomerEditForm";

export const dynamic = "force-dynamic";

type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral";
const STATUS: Record<string, { label: string; variant: StatusVariant }> = {
  new: { label: "未対応", variant: "warning" },
  in_progress: { label: "対応中", variant: "info" },
  quoted: { label: "見積済", variant: "info" },
  completed: { label: "完了", variant: "success" },
  cancelled: { label: "キャンセル", variant: "neutral" },
  archived: { label: "アーカイブ", variant: "neutral" },
};

const yen = (n: number | null) =>
  n != null ? "¥" + n.toLocaleString("ja-JP") : "—";

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createAdminClient();

  const { data: customer, error } = await supabase
    .from("customers")
    .select(
      "id, email, company_name, contact_name, phone, is_blocked, blocked_reason, notes, inquiry_count, last_inquiry_at, created_at",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (error || !customer) notFound();

  const { data: inquiries } = await supabase
    .from("inquiries")
    .select(
      "id, inquiry_number, status, quoted_amount, created_at, inquiry_items(id)",
    )
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  const rows = inquiries ?? [];

  return (
    <>
      <TopBar title="顧客 詳細" />
      <div className="flex flex-col gap-5 p-8">
        <Link
          href="/admin/customers"
          className="text-admin-xs text-admin-inkMute underline-offset-2 hover:underline"
        >
          ← 顧客一覧へ
        </Link>

        <div className="flex items-center gap-3">
          <h2 className="text-[22px] font-bold text-admin-ink">
            {customer.company_name || "（会社名なし）"}
          </h2>
          {customer.is_blocked && (
            <StatusBadge variant="danger">ブロック中</StatusBadge>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-5">
            <Card title="顧客情報">
              <dl className="grid grid-cols-[110px_1fr] gap-y-3 text-admin-sm">
                <dt className="text-admin-inkMute">メール</dt>
                <dd className="text-admin-ink">{customer.email}</dd>
                <dt className="text-admin-inkMute">担当者</dt>
                <dd className="text-admin-ink">{customer.contact_name ?? "—"}</dd>
                <dt className="text-admin-inkMute">電話</dt>
                <dd className="text-admin-ink">{customer.phone ?? "—"}</dd>
                <dt className="text-admin-inkMute">依頼件数</dt>
                <dd className="text-admin-ink">{rows.length} 件</dd>
              </dl>
            </Card>

            <Card title={`過去の見積依頼（${rows.length}件）`}>
              {rows.length === 0 ? (
                <p className="py-6 text-center text-admin-sm text-admin-inkSub">
                  依頼履歴はありません。
                </p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-admin-lineLight text-left text-admin-xs text-admin-inkMute">
                      <th className="py-2.5 font-medium">受付番号</th>
                      <th className="py-2.5 font-medium">受付日</th>
                      <th className="py-2.5 font-medium">商品数</th>
                      <th className="py-2.5 font-medium">回答見積</th>
                      <th className="py-2.5 font-medium">状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const st = STATUS[r.status] ?? STATUS.new;
                      const items = Array.isArray(r.inquiry_items)
                        ? r.inquiry_items.length
                        : 0;
                      return (
                        <tr
                          key={r.id}
                          className="border-b border-admin-lineLight last:border-0 hover:bg-admin-surfaceAlt"
                        >
                          <td className="py-2.5 font-dm text-admin-sm">
                            <Link
                              href={`/admin/inquiries/${r.id}`}
                              className="text-admin-ink underline-offset-2 hover:underline"
                            >
                              {r.inquiry_number}
                            </Link>
                          </td>
                          <td className="py-2.5 text-admin-xs text-admin-inkMute">
                            {new Date(r.created_at).toLocaleDateString("ja-JP")}
                          </td>
                          <td className="py-2.5 text-admin-sm text-admin-inkSub">
                            {items} 商品
                          </td>
                          <td className="py-2.5 text-admin-sm text-admin-ink">
                            {yen(r.quoted_amount)}
                          </td>
                          <td className="py-2.5">
                            <StatusBadge variant={st.variant}>
                              {st.label}
                            </StatusBadge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </Card>
          </div>

          <CustomerEditForm
            id={customer.id}
            email={customer.email}
            initialIsBlocked={customer.is_blocked === true}
            initialBlockedReason={customer.blocked_reason ?? ""}
            initialNotes={customer.notes ?? ""}
          />
        </div>
      </div>
    </>
  );
}
