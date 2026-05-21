import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/admin/TopBar";
import { Card } from "@/components/admin/Card";
import { computeDiff, type DiffStatus, type DiffEntry } from "@/lib/csv/diff";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<DiffStatus, { label: string; cls: string }> = {
  new: { label: "新規", cls: "bg-admin-successBg text-admin-success border-admin-success/30" },
  update: { label: "更新", cls: "bg-admin-infoBg text-admin-info border-admin-info/30" },
  unchanged: { label: "変更なし", cls: "bg-admin-neutralBg text-admin-neutral border-admin-neutral/30" },
  invalid: { label: "エラー", cls: "bg-admin-dangerBg text-admin-danger border-admin-danger/30" },
};

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { filter?: string };
}) {
  const supabase = createAdminClient();

  const { data: job } = await supabase
    .from("import_jobs")
    .select("id, source_filename, status, total_rows")
    .eq("id", params.id)
    .maybeSingle();
  if (!job) notFound();

  const { entries, counts } = await computeDiff(supabase, params.id);
  const filter = searchParams.filter as DiffStatus | undefined;
  const visible = filter ? entries.filter((e) => e.status === filter) : entries;

  return (
    <>
      <TopBar title="差分プレビュー" />
      <div className="flex flex-col gap-5 p-8">
        <div className="flex items-center justify-between">
          <Link
            href={`/admin/imports/${params.id}`}
            className="text-admin-xs text-admin-inkMute underline-offset-2 hover:underline"
          >
            ← ジョブ詳細に戻る
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/imports/${params.id}/preview-public`}
              className="flex min-h-10 items-center rounded-md border border-admin-line bg-admin-surface px-4 text-admin-sm font-medium text-admin-ink hover:bg-admin-surfaceAlt"
            >
              擬似プレビュー
            </Link>
            {counts.invalid === 0 && (
              <Link
                href={`/admin/imports/${params.id}/approve`}
                className="flex min-h-10 items-center rounded-md bg-admin-navy px-5 text-admin-sm font-bold text-white hover:bg-admin-navyHover"
              >
                承認 → 反映
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <CountTile id="new" label="新規追加" value={counts.new} color="text-admin-success" filter={filter} jobId={params.id} />
          <CountTile id="update" label="更新" value={counts.update} color="text-admin-info" filter={filter} jobId={params.id} />
          <CountTile id="unchanged" label="変更なし" value={counts.unchanged} color="text-admin-neutral" filter={filter} jobId={params.id} />
          <CountTile id="invalid" label="エラー (反映不可)" value={counts.invalid} color="text-admin-danger" filter={filter} jobId={params.id} />
        </div>

        {filter && (
          <div className="flex items-center gap-3">
            <span className="text-admin-sm text-admin-inkSub">
              フィルタ中: <strong>{STATUS_LABEL[filter].label}</strong>
            </span>
            <Link
              href={`/admin/imports/${params.id}/preview`}
              className="text-admin-xs text-admin-info underline-offset-2 hover:underline"
            >
              解除
            </Link>
          </div>
        )}

        <Card title={`${visible.length} 件を表示`}>
          {visible.length === 0 ? (
            <p className="py-8 text-center text-admin-sm text-admin-inkSub">
              該当する商品はありません。
            </p>
          ) : (
            <div className="grid gap-3">
              {visible.slice(0, 200).map((e) => (
                <Row key={e.stagingId} entry={e} jobId={params.id} />
              ))}
              {visible.length > 200 && (
                <p className="pt-2 text-center text-admin-xs text-admin-inkMute">
                  ...残り {visible.length - 200} 件は省略（フィルタを絞って閲覧してください）
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function CountTile({
  id,
  label,
  value,
  color,
  filter,
  jobId,
}: {
  id: DiffStatus;
  label: string;
  value: number;
  color: string;
  filter: DiffStatus | undefined;
  jobId: string;
}) {
  const active = filter === id;
  const href = active
    ? `/admin/imports/${jobId}/preview`
    : `/admin/imports/${jobId}/preview?filter=${id}`;
  return (
    <Link
      href={href}
      className={`block rounded-lg border bg-admin-surface p-5 transition-colors ${
        active ? "border-admin-navy" : "border-admin-line hover:border-admin-lineLight"
      }`}
    >
      <div className="mb-2 text-admin-sm text-admin-inkSub">{label}</div>
      <div className={`font-dm text-admin-h1 font-bold ${color}`}>
        {value.toLocaleString("ja-JP")}
      </div>
    </Link>
  );
}

function Row({ entry, jobId }: { entry: DiffEntry; jobId: string }) {
  const s = STATUS_LABEL[entry.status];
  return (
    <div className="grid grid-cols-[80px_1fr_auto] items-start gap-3 border-b border-admin-lineLight pb-3 last:border-0">
      <span
        className={`inline-flex h-6 items-center justify-center whitespace-nowrap rounded border px-2 text-admin-xs font-bold ${s.cls}`}
      >
        {s.label}
      </span>
      <div>
        <div className="text-admin-sm text-admin-ink">
          {entry.productName ?? "(無名)"}
        </div>
        <div className="font-dm text-admin-xs text-admin-inkMute">{entry.handle}</div>
        {entry.changes.length > 0 && (
          <div className="mt-2 grid gap-1">
            {entry.changes.map((c) => (
              <div key={c.field} className="text-admin-xs">
                <span className="text-admin-inkSub">{c.label}: </span>
                <span className="text-admin-danger line-through">
                  {c.before ?? "(空)"}
                </span>
                <span className="mx-2 text-admin-inkMute">→</span>
                <span className="text-admin-success">{c.after ?? "(空)"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {entry.status === "invalid" && (
        <Link
          href={`/admin/imports/${jobId}/rows/${entry.stagingId}`}
          className="text-admin-xs text-admin-info underline-offset-2 hover:underline"
        >
          修正 →
        </Link>
      )}
    </div>
  );
}
