import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/admin/TopBar";
import { Card } from "@/components/admin/Card";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const supabase = createAdminClient();
  const q = searchParams.q?.trim() ?? "";

  let query = supabase
    .from("customers")
    .select(
      "id, email, company_name, contact_name, is_blocked, inquiry_count, last_inquiry_at",
    )
    .order("last_inquiry_at", { ascending: false, nullsFirst: false });

  if (q) {
    const like = `%${q.replace(/[%,()]/g, " ")}%`;
    query = query.or(
      `company_name.ilike.${like},email.ilike.${like},contact_name.ilike.${like}`,
    );
  }

  const { data: rows, error } = await query;

  return (
    <>
      <TopBar title="顧客管理" />
      <div className="flex flex-col gap-5 p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <form method="get" className="flex gap-2">
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="会社名・メール・担当者で検索"
              className="h-11 w-72 rounded-md border border-admin-line bg-admin-surface px-3 text-admin-base outline-none focus:border-admin-navy"
            />
            <button
              type="submit"
              className="flex min-h-11 items-center rounded-md border border-admin-line px-4 text-admin-sm font-medium text-admin-ink hover:bg-admin-surfaceAlt"
            >
              検索
            </button>
          </form>
          <Link
            href="/admin/customers/blocklist"
            className="flex min-h-11 items-center rounded-md border border-admin-line px-4 text-admin-sm font-medium text-admin-inkSub hover:bg-admin-surfaceAlt"
          >
            ブロックリスト管理
          </Link>
        </div>

        <Card>
          {error ? (
            <p className="py-8 text-center text-admin-sm text-admin-danger">
              取得エラー: {error.message}
            </p>
          ) : (rows?.length ?? 0) === 0 ? (
            <p className="py-12 text-center text-admin-sm text-admin-inkSub">
              {q ? "該当する顧客がありません。" : "まだ顧客がありません。"}
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-admin-lineLight text-left text-admin-xs text-admin-inkMute">
                  <th className="py-3 font-medium">会社名 / メール</th>
                  <th className="py-3 font-medium">担当者</th>
                  <th className="py-3 font-medium">依頼件数</th>
                  <th className="py-3 font-medium">最終依頼日</th>
                  <th className="py-3 font-medium">状態</th>
                </tr>
              </thead>
              <tbody>
                {(rows ?? []).map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-admin-lineLight last:border-0 hover:bg-admin-surfaceAlt"
                  >
                    <td className="py-3 text-admin-sm">
                      <Link
                        href={`/admin/customers/${r.id}`}
                        className="font-medium text-admin-ink underline-offset-2 hover:underline"
                      >
                        {r.company_name || "（会社名なし）"}
                      </Link>
                      <div className="text-admin-xs text-admin-inkMute">
                        {r.email}
                      </div>
                    </td>
                    <td className="py-3 text-admin-sm text-admin-inkSub">
                      {r.contact_name ?? "—"}
                    </td>
                    <td className="py-3 text-admin-sm text-admin-inkSub">
                      {r.inquiry_count ?? 0} 件
                    </td>
                    <td className="py-3 text-admin-xs text-admin-inkMute">
                      {r.last_inquiry_at
                        ? new Date(r.last_inquiry_at).toLocaleString("ja-JP")
                        : "—"}
                    </td>
                    <td className="py-3">
                      {r.is_blocked ? (
                        <StatusBadge variant="danger">ブロック中</StatusBadge>
                      ) : (
                        <StatusBadge variant="neutral">通常</StatusBadge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  );
}
