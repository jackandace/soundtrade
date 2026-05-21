"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { revalidateJob } from "@/lib/csv/revalidate";

export type RevalidateResult =
  | { ok: true; total: number; errors: number; warnings: number }
  | { ok: false; error: string };

export async function revalidateImportJob(
  jobId: string,
): Promise<RevalidateResult> {
  await requireAdmin();
  const supabase = createAdminClient();

  try {
    const result = await revalidateJob(supabase, jobId);
    revalidatePath(`/admin/imports/${jobId}`);
    revalidatePath(`/admin/imports/${jobId}/preview`);
    return { ok: true, ...result };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
