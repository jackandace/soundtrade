import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { TopBar } from "@/components/admin/TopBar";
import { Card } from "@/components/admin/Card";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { RollbackButton } from "./RollbackButton";

export const dynamic = "force-dynamic";

type Variant = "success" | "warning" | "danger" | "info" | "neutral";

const TYPE_LABEL: Record<string, { label: string; variant: Variant }> = {
  pre_import: { label: "反映前", variant: "info" },
  post_import: { label: "反映後", variant: "success" },
  manual: { label: "手動", variant: "warning" },
  scheduled: { label: "定期", variant: "neutral" },
};

type SnapshotData = {
  products?: Array<{ handle: string; product_name?: string }>;
};

export default async function SnapshotDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = await requireAdmin();
  const supabase = createAdminClient();

  const { data: snap } = await supabase
    .from("product_snapshots")
    .select(
      "id, snapshot_type, triggered_by_name, related_job_id, product_count, variant_count, spec_count, size_bytes, is_protected, used_for_rollback_at, used_for_rollback_by, notes, data, created_at",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!snap) notFound();

  const data = (snap.data ?? {}) as SnapshotData;
  const sampleHandles = (data.products ?? []).slice(0, 12);
  const t = TYPE_LABEL[snap.snapshot_type] ?? TYPE_LABEL.manual;
  const canRollback = admin.role === "super_admin";

  return (
    <>
      <TopBar title="スナップショット詳細" />
      <div className="flex flex-col gap-5 p-8">
        <Link
          href="/admin/snapshots"
          className="text-admin-xs text-admin-inkMute underline-offset-2 hover:underline"
        >
          ← スナップショット一覧に戻る
        </Link>

        <Card
          title={new Date(snap.created_at).toLocaleString("ja-JP")}
          action={<StatusBadge variant={t.variant}>{t.label}</StatusBadge>}
        >
          <dl className="grid grid-cols-[160px_1fr] gap-y-3 text-admin-sm">
            <dt className="text-admin-inkSub">スナップショット ID</dt>
            <dd className="font-dm text-admin-xs text-admin-ink">{snap.id}</dd>
            <dt className="text-admin-inkSub">作成者</dt>
            <dd className="text-admin-ink">{snap.triggered_by_name ?? "—"}</dd>
            <dt className="text-admin-inkSub">関連ジョブ</dt>
            <dd>
              {snap.related_job_id ? (
                <Link
                  href={`/admin/imports/${snap.related_job_id}`}
                  className="font-dm text-admin-xs text-admin-info underline-offset-2 hover:underline"
                >
                  {snap.related_job_id}
                </Link>
              ) : (
                <span className="text-admin-inkSub">—</span>
              )}
            </dd>
            <dt className="text-admin-inkSub">商品 / バリアント / スペック</dt>
            <dd className="font-dm text-admin-ink">
              {snap.product_count ?? 0} / {snap.variant_count ?? 0} /{" "}
              {snap.spec_count ?? 0}
            </dd>
            <dt className="text-admin-inkSub">JSONB サイズ</dt>
            <dd className="font-dm text-admin-ink">
              {formatBytes(Number(snap.size_bytes ?? 0))}
            </dd>
            {snap.is_protected && (
              <>
                <dt className="text-admin-inkSub">保護</dt>
                <dd className="text-admin-info">🔒 自動削除されません</dd>
              </>
            )}
            {snap.used_for_rollback_at && (
              <>
                <dt className="text-admin-inkSub">ロールバック使用</dt>
                <dd className="text-admin-warning">
                  {new Date(snap.used_for_rollback_at).toLocaleString("ja-JP")} に実行済
                </dd>
              </>
            )}
            {snap.notes && (
              <>
                <dt className="text-admin-inkSub">メモ</dt>
                <dd className="text-admin-ink">{snap.notes}</dd>
              </>
            )}
          </dl>
        </Card>

        {sampleHandles.length > 0 && (
          <Card title="含まれる商品（先頭 12 件）">
            <ul className="grid grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-3">
              {sampleHandles.map((p, i) => (
                <li
                  key={i}
                  className="flex flex-col gap-0.5 rounded border border-admin-lineLight bg-admin-surfaceAlt px-3 py-2 text-admin-sm"
                >
                  <span className="text-admin-ink">
                    {p.product_name ?? p.handle}
                  </span>
                  <span className="font-dm text-admin-xs text-admin-inkMute">
                    {p.handle}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-admin-xs text-admin-inkMute">
              ※ 残り {Math.max(0, (snap.product_count ?? 0) - sampleHandles.length)} 件は省略
            </p>
          </Card>
        )}

        <Card title="ロールバック">
          {canRollback ? (
            <>
              <p className="mb-4 text-admin-sm text-admin-ink">
                このスナップショットの状態に戻します。実行前後の両端で自動スナップショットが作られるので、やり直しも可能です。
              </p>
              <RollbackButton
                snapshotId={snap.id}
                productCount={snap.product_count ?? 0}
                variantCount={snap.variant_count ?? 0}
                specCount={snap.spec_count ?? 0}
                createdAt={snap.created_at}
              />
            </>
          ) : (
            <p className="text-admin-sm text-admin-inkSub">
              ロールバックは <strong>super_admin</strong> ロールのみ実行可能です。
              現在のあなたのロール: <strong>{admin.role}</strong>
            </p>
          )}
        </Card>
      </div>
    </>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}
