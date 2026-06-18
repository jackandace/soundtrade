"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { applyImport, type ApplyResult } from "@/lib/csv/apply";
import { sendImportSuccess } from "@/lib/email/import";
import { getAdminEmails } from "@/lib/email/client";
import { getSiteUrl } from "@/lib/seo";

export async function approveAndApply(
  jobId: string,
  partialUpdate = false,
): Promise<ApplyResult> {
  const admin = await requireAdmin();

  if (admin.role !== "super_admin" && admin.role !== "admin") {
    return { ok: false, error: "承認権限がありません（admin / super_admin のみ実行可能）" };
  }

  const supabase = createAdminClient();

  const { data: job } = await supabase
    .from("import_jobs")
    .select("id, status, error_rows, total_rows, source_filename")
    .eq("id", jobId)
    .maybeSingle();
  if (!job) {
    return { ok: false, error: "ジョブが見つかりません" };
  }
  if (job.status === "completed") {
    return { ok: false, error: "このジョブは既に反映済みです" };
  }
  if (job.status === "applying") {
    return { ok: false, error: "反映処理が進行中です" };
  }
  if ((job.error_rows ?? 0) > 0) {
    return {
      ok: false,
      error: `エラー行が ${job.error_rows} 件あるため反映できません。修正してから再実行してください`,
    };
  }
  if ((job.total_rows ?? 0) === 0) {
    return { ok: false, error: "反映する商品行がありません" };
  }

  const result = await applyImport(supabase, jobId, admin.id, partialUpdate);

  if (result.ok) {
    const adminEmails = await getAdminEmails(async () => {
      const { data } = await supabase
        .from("admin_users")
        .select("email")
        .in("role", ["super_admin", "admin"])
        .eq("is_active", true);
      return (data ?? [])
        .map((r) => r.email)
        .filter((e): e is string => typeof e === "string" && e.length > 0);
    });

    await sendImportSuccess(
      {
        jobId,
        filename: job.source_filename ?? "(無名)",
        uploaderName: admin.display_name,
        productsAffected: result.productsAffected,
        variantsAffected: result.variantsAffected,
        specsAffected: result.specsAffected,
        snapshotId: result.snapshotId,
        jobUrl: `${getSiteUrl()}/admin/imports/${jobId}`,
      },
      adminEmails,
    );
  }

  revalidatePath(`/admin/imports/${jobId}`);
  revalidatePath("/admin/imports");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/products");
  revalidatePath("/catalog");
  revalidatePath("/");

  return result;
}
