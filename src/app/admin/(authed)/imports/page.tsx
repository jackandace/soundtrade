import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/admin/TopBar";
import { Card } from "@/components/admin/Card";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const dynamic = "force-dynamic";

type Variant = "success" | "warning" | "danger" | "info" | "neutral";

const JOB_STATUS: Record<string, { label: string; variant: Variant }> = {
  pending: { label: "受付中", variant: "neutral" },
  validating: { label: "検証中", variant: "info" },
  reviewing: { label: "確認待ち", variant: "warning" },
  approved: { label: "承認済", variant: "info" },
  applying: { label: "反映中", variant: "info" },
  completed: { label: "完了", variant: "success" },
  failed: { label: "失敗", variant: "danger" },
  discarded: { label: "破棄", variant: "neutral" },
};

export default async function ImportsListPage() {
  const supabase = createAdminClient();
  const { data: jobs, error } = await supabase
    .from("import_jobs")
    .select(
      "id, job_type, source_filename, status, total_rows, valid_rows, warning_rows, error_rows, uploader_name, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <>
      <TopBar title="CSV取込" />
      <div className="flex flex-col gap-5 p-8">
        <div className="flex items-center justify-between">
          <p className="text-admin-sm text-admin-inkSub">
            直近 50 件のアップロード履歴
          </p>
          <Link
            href="/admin/imports/new"
            className="flex min-h-12 items-center rounded-md bg-admin-navy px-6 text-admin-base font-bold text-white hover:bg-admin-navyHover"
          >
            + 新規アップロード
          </Link>
        </div>

        <Card>
          {error ? (
            <p className="py-8 text-center text-admin-sm text-admin-danger">
              取得エラー: {error.message}
            </p>
          ) : (jobs?.length ?? 0) === 0 ? (
            <p className="py-12 text-center text-admin-sm text-admin-inkSub">
              まだ取込ジョブはありません。
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-admin-lineLight text-left text-admin-xs text-admin-inkMute">
                  <th className="py-3 font-medium">ファイル</th>
                  <th className="py-3 font-medium">種別</th>
                  <th className="py-3 font-medium">状態</th>
                  <th className="py-3 font-medium">件数 (全 / エラー / 警告)</th>
                  <th className="py-3 font-medium">アップロード者</th>
                  <th className="py-3 font-medium">受付日時</th>
                </tr>
              </thead>
              <tbody>
                {(jobs ?? []).map((j) => {
                  const st = JOB_STATUS[j.status] ?? JOB_STATUS.pending;
                  return (
                    <tr
                      key={j.id}
                      className="border-b border-admin-lineLight last:border-0 hover:bg-admin-surfaceAlt"
                    >
                      <td className="py-3 text-admin-sm">
                        <Link
                          href={`/admin/imports/${j.id}`}
                          className="text-admin-ink underline-offset-2 hover:underline"
                        >
                          {j.source_filename ?? "(無名)"}
                        </Link>
                      </td>
                      <td className="py-3 text-admin-xs text-admin-inkSub">
                        {j.job_type === "shopify_csv" ? "Pattern A" : "Pattern B"}
                      </td>
                      <td className="py-3">
                        <StatusBadge variant={st.variant}>{st.label}</StatusBadge>
                      </td>
                      <td className="py-3 font-dm text-admin-sm">
                        <span className="text-admin-ink">{j.total_rows ?? 0}</span>
                        {(j.error_rows ?? 0) > 0 && (
                          <span className="ml-2 text-admin-danger">
                            ● {j.error_rows}
                          </span>
                        )}
                        {(j.warning_rows ?? 0) > 0 && (
                          <span className="ml-2 text-admin-warning">
                            ⚠ {j.warning_rows}
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-admin-sm text-admin-inkSub">
                        {j.uploader_name ?? "—"}
                      </td>
                      <td className="py-3 text-admin-xs text-admin-inkMute">
                        {new Date(j.created_at).toLocaleString("ja-JP")}
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
