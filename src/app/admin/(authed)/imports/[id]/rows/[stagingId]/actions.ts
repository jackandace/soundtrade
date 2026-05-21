"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { revalidateJob } from "@/lib/csv/revalidate";

export type SaveRowArgs = {
  jobId: string;
  stagingId: string;
  handle: string;
  product_name: string;
  maker: string;
  category_l1: string;
  category_l2: string;
  category_l3: string;
  msrp_incl_tax: string;
  status: string;
  description_short: string;
};

export type SaveRowResult =
  | { ok: true }
  | { ok: false; error: string };

export async function saveStagingRow(
  args: SaveRowArgs,
): Promise<SaveRowResult> {
  await requireAdmin();

  let priceIncl: number | null = null;
  if (args.msrp_incl_tax.trim() !== "") {
    const n = Number(args.msrp_incl_tax.replace(/,/g, ""));
    if (!Number.isFinite(n) || n < 0) {
      return { ok: false, error: "価格は 0 以上の数値で入力してください" };
    }
    priceIncl = Math.floor(n);
  }
  const priceExcl = priceIncl != null ? Math.round(priceIncl / 1.1) : null;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("products_staging")
    .update({
      handle: args.handle.trim(),
      product_name: args.product_name.trim() || null,
      maker: args.maker.trim() || null,
      category_l1: args.category_l1.trim() || null,
      category_l2: args.category_l2.trim() || null,
      category_l3: args.category_l3.trim() || null,
      msrp: priceExcl,
      msrp_incl_tax: priceIncl,
      status: args.status,
      description_short: args.description_short.trim() || null,
    })
    .eq("id", args.stagingId);

  if (error) return { ok: false, error: error.message };

  // ジョブ単位で再検証（DUPLICATE_HANDLE 等が他行に波及するため）
  await revalidateJob(supabase, args.jobId);

  revalidatePath(`/admin/imports/${args.jobId}`);
  revalidatePath(`/admin/imports/${args.jobId}/preview`);
  return { ok: true };
}
