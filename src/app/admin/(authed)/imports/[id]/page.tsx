import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/admin/TopBar";
import { Card } from "@/components/admin/Card";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { RevalidateButton } from "./RevalidateButton";

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

export default async function ImportDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createAdminClient();
  const { data: job } = await supabase
    .from("import_jobs")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!job) notFound();

  const { data: errors } = await supabase
    .from("import_errors")
    .select(
      "id, severity, error_code, row_number, field_name, field_value, message, suggestion, staging_product_id",
    )
    .eq("import_job_id", job.id)
    .order("severity", { ascending: true })
    .order("row_number", { ascending: true })
    .limit(500);

  const errs = (errors ?? []).filter((e) => e.severity === "error");
  const warns = (errors ?? []).filter((e) => e.severity === "warning");
  const st = JOB_STATUS[job.status] ?? JOB_STATUS.pending;

  return (
    <>
      <TopBar title="CSV取込ジョブ詳細" />
      <div className="flex flex-col gap-5 p-8">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/imports"
            className="text-admin-xs text-admin-inkMute underline-offset-2 hover:underline"
          >
            ← ジョブ一覧に戻る
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <RevalidateButton jobId={job.id} />
            <Link
              href={`/admin/imports/${job.id}/preview`}
              className="flex min-h-11 items-center rounded-md border border-admin-line bg-admin-surface px-4 text-admin-sm font-medium text-admin-ink hover:bg-admin-surfaceAlt"
            >
              差分プレビュー
            </Link>
            <Link
              href={`/admin/imports/${job.id}/preview-public`}
              className="flex min-h-11 items-center rounded-md border border-admin-line bg-admin-surface px-4 text-admin-sm font-medium text-admin-ink hover:bg-admin-surfaceAlt"
            >
              擬似プレビュー
            </Link>
            {(job.error_rows ?? 0) === 0 && job.status !== "completed" && (
              <Link
                href={`/admin/imports/${job.id}/approve`}
                className="flex min-h-11 items-center rounded-md bg-admin-navy px-5 text-admin-sm font-bold text-white hover:bg-admin-navyHover"
              >
                承認 → 反映
              </Link>
            )}
            {job.status === "completed" && (
              <span className="flex min-h-11 items-center rounded-md bg-admin-successBg px-5 text-admin-sm font-bold text-admin-success">
                ✓ 反映済み
              </span>
            )}
          </div>
        </div>

        <Card
          title={job.source_filename ?? "(無名)"}
          action={<StatusBadge variant={st.variant}>{st.label}</StatusBadge>}
        >
          <dl className="grid grid-cols-[140px_1fr] gap-y-3 text-admin-sm">
            <dt className="text-admin-inkSub">ジョブ ID</dt>
            <dd className="font-dm text-admin-xs text-admin-ink">{job.id}</dd>
            <dt className="text-admin-inkSub">パターン</dt>
            <dd className="text-admin-ink">
              {job.job_type === "shopify_csv"
                ? "A: Shopify 1ファイル"
                : "B: 分割版（products / variants / specs）"}
            </dd>
            <dt className="text-admin-inkSub">ファイルサイズ</dt>
            <dd className="text-admin-ink">
              {Math.round(Number(job.source_size ?? 0) / 1024).toLocaleString("ja-JP")} KB
            </dd>
            <dt className="text-admin-inkSub">アップロード者</dt>
            <dd className="text-admin-ink">{job.uploader_name ?? "—"}</dd>
            <dt className="text-admin-inkSub">受付日時</dt>
            <dd className="text-admin-ink">
              {new Date(job.created_at).toLocaleString("ja-JP")}
            </dd>
          </dl>
        </Card>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="全行数" value={job.total_rows} color="text-admin-ink" />
          <Stat label="正常" value={job.valid_rows} color="text-admin-success" />
          <Stat label="警告" value={job.warning_rows} color="text-admin-warning" />
          <Stat label="エラー" value={job.error_rows} color="text-admin-danger" />
        </div>

        {errs.length === 0 && warns.length === 0 && job.status !== "failed" ? (
          <Card>
            <div className="py-8 text-center">
              <div className="mb-2 text-admin-success">
                ✓ 検出された問題はありません
              </div>
              <p className="text-admin-xs text-admin-inkMute">
                差分プレビューで反映内容を確認してください。
              </p>
            </div>
          </Card>
        ) : (
          <>
            {errs.length > 0 && (
              <Card title={`エラー (${errs.length} 件 ・ 修正が必要)`}>
                <IssueList items={errs} jobId={job.id} />
              </Card>
            )}
            {warns.length > 0 && (
              <Card title={`警告 (${warns.length} 件 ・ 確認推奨)`}>
                <IssueList items={warns} jobId={job.id} />
              </Card>
            )}
          </>
        )}
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number | null;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-admin-line bg-admin-surface p-5">
      <div className="mb-2 text-admin-sm text-admin-inkSub">{label}</div>
      <div className={`font-dm text-admin-h1 font-bold ${color}`}>
        {(value ?? 0).toLocaleString("ja-JP")}
      </div>
    </div>
  );
}

type Issue = {
  id: string;
  severity: string;
  error_code: string;
  row_number: number | null;
  field_name: string | null;
  field_value: string | null;
  message: string;
  suggestion: string | null;
  staging_product_id: string | null;
};

function IssueList({ items, jobId }: { items: Issue[]; jobId: string }) {
  return (
    <div className="grid gap-2">
      {items.slice(0, 200).map((it) => (
        <div
          key={it.id}
          className="grid grid-cols-[90px_1fr_auto] items-start gap-3 border-b border-admin-lineLight pb-2 last:border-0"
        >
          <div className="text-admin-xs text-admin-inkMute">
            {it.row_number ? `Row ${it.row_number}` : "—"}
            {it.field_name && (
              <div className="font-dm text-admin-inkMute">{it.field_name}</div>
            )}
          </div>
          <div>
            <div className="font-dm text-admin-xs text-admin-inkMute">
              {it.error_code}
            </div>
            <div className="text-admin-sm text-admin-ink">{it.message}</div>
            {it.suggestion && (
              <div className="mt-0.5 text-admin-xs text-admin-inkSub">
                💡 {it.suggestion}
              </div>
            )}
          </div>
          {it.staging_product_id && (
            <Link
              href={`/admin/imports/${jobId}/rows/${it.staging_product_id}`}
              className="text-admin-xs text-admin-info underline-offset-2 hover:underline"
            >
              修正 →
            </Link>
          )}
        </div>
      ))}
      {items.length > 200 && (
        <p className="pt-2 text-center text-admin-xs text-admin-inkMute">
          ...残り {items.length - 200} 件は省略
        </p>
      )}
    </div>
  );
}
