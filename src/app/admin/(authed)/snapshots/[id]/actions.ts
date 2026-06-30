"use server";

import { revalidatePath } from "next/cache";
import { revalidatePublic } from "@/lib/revalidate-public";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

export type RollbackResult =
  | {
      ok: true;
      restoredProducts: number;
      restoredVariants: number;
      restoredSpecs: number;
    }
  | { ok: false; error: string };

export async function rollbackToSnapshot(
  snapshotId: string,
  confirmText: string,
): Promise<RollbackResult> {
  const admin = await requireAdmin();

  // ロールバックは super_admin のみ（spec の権限表に従う）
  if (admin.role !== "super_admin") {
    return {
      ok: false,
      error: "ロールバックは super_admin のみ実行可能です",
    };
  }

  // 誤操作防止: 確認テキストを要求
  if (confirmText !== "ROLLBACK") {
    return {
      ok: false,
      error: "確認テキストが一致しません",
    };
  }

  const supabase = createAdminClient();

  // 対象スナップショットの存在チェック
  const { data: snap } = await supabase
    .from("product_snapshots")
    .select("id, snapshot_type, product_count")
    .eq("id", snapshotId)
    .maybeSingle();
  if (!snap) {
    return { ok: false, error: "スナップショットが見つかりません" };
  }

  // rollback_to_snapshot RPC を呼ぶ（実行前に自動 snapshot 作成 → TRUNCATE → 復元 を 1 トランザクションで実行）
  const { data, error } = await supabase.rpc("rollback_to_snapshot", {
    p_snapshot_id: snapshotId,
    p_executor_id: admin.id,
  });

  if (error) {
    await supabase.rpc("write_audit_log", {
      p_action: "snapshot.rollback_failed",
      p_resource_type: "product_snapshots",
      p_resource_id: snapshotId,
      p_payload: { error: error.message },
      p_risk_level: "high",
    });
    return { ok: false, error: `ロールバック失敗: ${error.message}` };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const restoredProducts = Number(row?.restored_products ?? 0);
  const restoredVariants = Number(row?.restored_variants ?? 0);
  const restoredSpecs = Number(row?.restored_specs ?? 0);

  // 使用済みフラグを更新
  await supabase
    .from("product_snapshots")
    .update({
      used_for_rollback_at: new Date().toISOString(),
      used_for_rollback_by: admin.id,
    })
    .eq("id", snapshotId);

  // 監査ログ（high risk）
  await supabase.rpc("write_audit_log", {
    p_action: "snapshot.rollback",
    p_resource_type: "product_snapshots",
    p_resource_id: snapshotId,
    p_payload: {
      restored_products: restoredProducts,
      restored_variants: restoredVariants,
      restored_specs: restoredSpecs,
    },
    p_risk_level: "high",
  });

  // 公開サイト + 管理画面のキャッシュを破棄
  revalidatePublic();
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/products");
  revalidatePath("/admin/snapshots");
  revalidatePath(`/admin/snapshots/${snapshotId}`);

  return {
    ok: true,
    restoredProducts,
    restoredVariants,
    restoredSpecs,
  };
}
