import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/admin/TopBar";
import { Card } from "@/components/admin/Card";
import { computeDiff } from "@/lib/csv/diff";
import { ApproveButton } from "./ApproveButton";

export const dynamic = "force-dynamic";

export default async function ApprovePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createAdminClient();
  const { data: job } = await supabase
    .from("import_jobs")
    .select(
      "id, source_filename, status, total_rows, valid_rows, warning_rows, error_rows, completed_at",
    )
    .eq("id", params.id)
    .maybeSingle();
  if (!job) notFound();

  // 完了済みのジョブは詳細画面へ
  if (job.status === "completed") {
    redirect(`/admin/imports/${params.id}`);
  }

  const { counts } = await computeDiff(supabase, params.id);
  const canApply = (job.error_rows ?? 0) === 0 && (job.total_rows ?? 0) > 0;

  return (
    <>
      <TopBar title="承認 → 反映" />
      <div className="flex flex-col gap-5 p-8">
        <Link
          href={`/admin/imports/${params.id}`}
          className="text-admin-xs text-admin-inkMute underline-offset-2 hover:underline"
        >
          ← ジョブ詳細に戻る
        </Link>

        <Card title={`反映内容の確認: ${job.source_filename ?? ""}`}>
          <div className="grid gap-4">
            <div className="grid grid-cols-4 gap-3">
              <SmallStat label="新規" value={counts.new} color="text-admin-success" />
              <SmallStat label="更新" value={counts.update} color="text-admin-info" />
              <SmallStat
                label="変更なし"
                value={counts.unchanged}
                color="text-admin-neutral"
              />
              <SmallStat
                label="エラー"
                value={counts.invalid}
                color="text-admin-danger"
              />
            </div>

            <div className="rounded-md border border-admin-warning/30 bg-admin-warningBg p-4 text-admin-sm">
              <div className="mb-1 flex items-center gap-2 font-bold text-admin-warning">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                  <path d="M12 9v4M12 17h.01" />
                </svg>
                反映前に必ず擬似プレビューで確認してください
              </div>
              <p className="text-admin-ink">
                公開サイトに即座に反映されます。取消は super_admin のロールバック操作（Phase 2 機能）が必要です。
              </p>
              <div className="mt-2">
                <Link
                  href={`/admin/imports/${params.id}/preview-public`}
                  className="text-admin-info underline-offset-2 hover:underline"
                >
                  → 擬似プレビューを開く
                </Link>
              </div>
            </div>

            {!canApply && (
              <div className="rounded-md border border-admin-danger/30 bg-admin-dangerBg p-4 text-admin-sm text-admin-danger">
                エラー行が {job.error_rows ?? 0} 件あるため反映できません。修正してから再度お試しください。
              </div>
            )}
          </div>
        </Card>

        <Card title="本番反映">
          {canApply ? (
            <ApproveButton jobId={job.id} productsCount={job.total_rows ?? 0} />
          ) : (
            <p className="text-admin-sm text-admin-inkSub">
              反映できません（エラー解消後に再表示してください）。
            </p>
          )}
        </Card>
      </div>
    </>
  );
}

function SmallStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded border border-admin-line bg-admin-surfaceAlt p-3 text-center">
      <div className="text-admin-xs text-admin-inkSub">{label}</div>
      <div className={`font-dm text-admin-h3 font-bold ${color}`}>
        {value.toLocaleString("ja-JP")}
      </div>
    </div>
  );
}
