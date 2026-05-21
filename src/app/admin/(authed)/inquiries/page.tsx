import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/admin/TopBar";
import { Card } from "@/components/admin/Card";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const dynamic = "force-dynamic";

type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral";

const INQUIRY_STATUS: Record<string, { label: string; variant: StatusVariant }> = {
  new: { label: "未対応", variant: "warning" },
  in_progress: { label: "対応中", variant: "info" },
  quoted: { label: "見積済", variant: "info" },
  completed: { label: "完了", variant: "success" },
  cancelled: { label: "キャンセル", variant: "neutral" },
};

const STATUS_TABS = [
  { id: "all", label: "すべて" },
  { id: "new", label: "未対応" },
  { id: "in_progress", label: "対応中" },
  { id: "quoted", label: "見積済" },
  { id: "completed", label: "完了" },
  { id: "cancelled", label: "キャンセル" },
];

export default async function InquiriesListPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createAdminClient();
  const selectedStatus = searchParams.status ?? "all";

  let query = supabase
    .from("inquiries")
    .select("id, inquiry_number, company_name, contact_name, email, status, created_at, inquiry_items(id)")
    .order("created_at", { ascending: false });

  if (selectedStatus !== "all" && INQUIRY_STATUS[selectedStatus]) {
    query = query.eq("status", selectedStatus);
  }

  const { data: rows, error } = await query;

  return (
    <>
      <TopBar title="見積依頼" />
      <div className="flex flex-col gap-5 p-8">
        <div className="flex flex-wrap gap-1 rounded-md border border-admin-line bg-admin-surface p-1">
          {STATUS_TABS.map((t) => {
            const active = selectedStatus === t.id;
            return (
              <Link
                key={t.id}
                href={t.id === "all" ? "/admin/inquiries" : `/admin/inquiries?status=${t.id}`}
                className={`flex min-h-10 items-center rounded px-4 text-admin-sm font-medium ${
                  active
                    ? "bg-admin-navy text-white"
                    : "text-admin-inkSub hover:bg-admin-surfaceAlt"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        <Card>
          {error ? (
            <p className="py-8 text-center text-admin-sm text-admin-danger">
              取得エラー: {error.message}
            </p>
          ) : (rows?.length ?? 0) === 0 ? (
            <p className="py-12 text-center text-admin-sm text-admin-inkSub">
              該当する見積依頼はありません。
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-admin-lineLight text-left text-admin-xs text-admin-inkMute">
                  <th className="py-3 font-medium">受付番号</th>
                  <th className="py-3 font-medium">会社名 / 担当者</th>
                  <th className="py-3 font-medium">商品数</th>
                  <th className="py-3 font-medium">ステータス</th>
                  <th className="py-3 font-medium">受付日時</th>
                </tr>
              </thead>
              <tbody>
                {(rows ?? []).map((r) => {
                  const status = INQUIRY_STATUS[r.status] ?? INQUIRY_STATUS.new;
                  const itemCount = Array.isArray(r.inquiry_items)
                    ? r.inquiry_items.length
                    : 0;
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-admin-lineLight last:border-0 hover:bg-admin-surfaceAlt"
                    >
                      <td className="py-3 font-dm text-admin-sm">
                        <Link
                          href={`/admin/inquiries/${r.id}`}
                          className="text-admin-ink underline-offset-2 hover:underline"
                        >
                          {r.inquiry_number}
                        </Link>
                      </td>
                      <td className="py-3 text-admin-sm">
                        <div className="text-admin-ink">{r.company_name}</div>
                        <div className="text-admin-xs text-admin-inkMute">
                          {r.contact_name ?? "—"}
                        </div>
                      </td>
                      <td className="py-3 text-admin-sm text-admin-inkSub">
                        {itemCount} 商品
                      </td>
                      <td className="py-3">
                        <StatusBadge variant={status.variant}>
                          {status.label}
                        </StatusBadge>
                      </td>
                      <td className="py-3 text-admin-xs text-admin-inkMute">
                        {new Date(r.created_at).toLocaleString("ja-JP")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  );
}
