import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/admin/TopBar";
import { Card } from "@/components/admin/Card";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const dynamic = "force-dynamic";

type Variant = "success" | "warning" | "danger" | "info" | "neutral";

const TYPE_LABEL: Record<string, { label: string; variant: Variant }> = {
  pre_import: { label: "反映前", variant: "info" },
  post_import: { label: "反映後", variant: "success" },
  manual: { label: "手動", variant: "warning" },
  scheduled: { label: "定期", variant: "neutral" },
};

export default async function SnapshotsListPage() {
  const supabase = createAdminClient();
  const { data: snaps, error } = await supabase
    .from("product_snapshots")
    .select(
      "id, snapshot_type, triggered_by_name, related_job_id, product_count, variant_count, spec_count, size_bytes, is_protected, used_for_rollback_at, notes, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <TopBar title="スナップショット" />
      <div className="flex flex-col gap-5 p-8">
        <p className="text-admin-sm text-admin-inkSub">
          直近 100 件のスナップショット履歴。CSV 反映時に自動作成され、
          手動ロールバック（super_admin のみ）の起点になります。
        </p>

        <Card>
          {error ? (
            <p className="py-8 text-center text-admin-sm text-admin-danger">
              取得エラー: {error.message}
            </p>
          ) : (snaps?.length ?? 0) === 0 ? (
            <p className="py-12 text-center text-admin-sm text-admin-inkSub">
              まだスナップショットはありません。
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-admin-lineLight text-left text-admin-xs text-admin-inkMute">
                  <th className="py-3 font-medium">作成日時</th>
                  <th className="py-3 font-medium">種別</th>
                  <th className="py-3 font-medium">統計 (商品 / バリアント / スペック)</th>
                  <th className="py-3 font-medium">サイズ</th>
                  <th className="py-3 font-medium">作成者</th>
                  <th className="py-3 font-medium">状態</th>
                </tr>
              </thead>
              <tbody>
                {(snaps ?? []).map((s) => {
                  const t = TYPE_LABEL[s.snapshot_type] ?? TYPE_LABEL.manual;
                  return (
                    <tr
                      key={s.id}
                      className="border-b border-admin-lineLight last:border-0 hover:bg-admin-surfaceAlt"
                    >
                      <td className="py-3 text-admin-sm">
                        <Link
                          href={`/admin/snapshots/${s.id}`}
                          className="text-admin-ink underline-offset-2 hover:underline"
                        >
                          {new Date(s.created_at).toLocaleString("ja-JP")}
                        </Link>
                        <div className="font-dm text-[10px] text-admin-inkMute">
                          {s.id.slice(0, 8)}
                        </div>
                      </td>
                      <td className="py-3">
                        <StatusBadge variant={t.variant}>{t.label}</StatusBadge>
                      </td>
                      <td className="py-3 font-dm text-admin-sm text-admin-ink">
                        {s.product_count ?? 0} / {s.variant_count ?? 0} / {s.spec_count ?? 0}
                      </td>
                      <td className="py-3 font-dm text-admin-sm text-admin-inkSub">
                        {formatBytes(Number(s.size_bytes ?? 0))}
                      </td>
                      <td className="py-3 text-admin-sm text-admin-inkSub">
                        {s.triggered_by_name ?? "—"}
                      </td>
                      <td className="py-3 text-admin-xs">
                        {s.is_protected && (
                          <span className="mr-2 inline-flex items-center gap-1 rounded bg-admin-infoBg px-1.5 py-0.5 text-admin-info">
                            🔒 保護
                          </span>
                        )}
                        {s.used_for_rollback_at && (
                          <span className="inline-flex items-center gap-1 rounded bg-admin-warningBg px-1.5 py-0.5 text-admin-warning">
                            ⤴ 使用済
                          </span>
                        )}
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

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}
