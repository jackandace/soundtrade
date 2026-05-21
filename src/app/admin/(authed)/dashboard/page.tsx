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

export default async function DashboardPage() {
  const supabase = createAdminClient();
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

  const [
    { count: todayCount },
    { count: pendingCount },
    { count: activeCount },
    { count: draftCount },
    { data: recent },
  ] = await Promise.all([
    supabase.from("inquiries").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
    supabase.from("inquiries").select("*", { count: "exact", head: true }).in("status", ["new", "in_progress"]),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("status", "draft"),
    supabase
      .from("inquiries")
      .select("id, inquiry_number, company_name, status, created_at, inquiry_items(id)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const stats = [
    { label: "本日の見積依頼", value: todayCount ?? 0, unit: "件", color: "text-admin-info", bg: "bg-admin-infoBg" },
    { label: "未対応の依頼", value: pendingCount ?? 0, unit: "件", color: "text-admin-warning", bg: "bg-admin-warningBg" },
    { label: "公開中の商品", value: activeCount ?? 0, unit: "点", color: "text-admin-success", bg: "bg-admin-successBg" },
    { label: "下書きの商品", value: draftCount ?? 0, unit: "点", color: "text-admin-neutral", bg: "bg-admin-neutralBg" },
  ];

  return (
    <>
      <TopBar title="ダッシュボード" />
      <div className="flex flex-col gap-6 p-8">
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-admin-line bg-admin-surface p-5"
            >
              <div className="mb-3.5 flex items-start justify-between">
                <span className="text-admin-sm text-admin-inkSub">{s.label}</span>
                <span className={`h-9 w-9 rounded-md ${s.bg}`} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-admin-h1 font-bold ${s.color}`}>
                  {s.value.toLocaleString("ja-JP")}
                </span>
                <span className="text-admin-sm text-admin-inkSub">{s.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <Card
          title="最近の見積依頼"
          action={
            <Link
              href="/admin/inquiries"
              className="border-b border-admin-inkSub text-admin-sm text-admin-inkSub hover:text-admin-ink"
            >
              すべて見る →
            </Link>
          }
        >
          {(recent?.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-admin-sm text-admin-inkSub">
              まだ見積依頼はありません。
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-admin-lineLight text-left text-admin-xs text-admin-inkMute">
                  <th className="py-2 font-medium">受付番号</th>
                  <th className="py-2 font-medium">会社名</th>
                  <th className="py-2 font-medium">点数</th>
                  <th className="py-2 font-medium">ステータス</th>
                  <th className="py-2 font-medium">受付日時</th>
                </tr>
              </thead>
              <tbody>
                {(recent ?? []).map((r) => {
                  const status = INQUIRY_STATUS[r.status] ?? INQUIRY_STATUS.new;
                  const itemCount = Array.isArray(r.inquiry_items)
                    ? r.inquiry_items.length
                    : 0;
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-admin-lineLight last:border-0"
                    >
                      <td className="py-3 font-dm text-admin-sm text-admin-ink">
                        <Link
                          href={`/admin/inquiries/${r.id}`}
                          className="hover:underline"
                        >
                          {r.inquiry_number}
                        </Link>
                      </td>
                      <td className="py-3 text-admin-sm text-admin-ink">
                        {r.company_name}
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
