"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

const VALID_STATUSES = ["new", "in_progress", "quoted", "completed", "cancelled", "archived"] as const;

export type UpdateInquiryArgs = {
  id: string;
  status: string;
  internalNotes: string;
  quotedAmount: string;
};

export type UpdateInquiryResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateInquiry(
  args: UpdateInquiryArgs,
): Promise<UpdateInquiryResult> {
  await requireAdmin();

  if (!VALID_STATUSES.includes(args.status as (typeof VALID_STATUSES)[number])) {
    return { ok: false, error: "ステータスの値が不正です" };
  }

  let quotedAmount: number | null = null;
  if (args.quotedAmount.trim() !== "") {
    const n = Number(args.quotedAmount.replace(/,/g, ""));
    if (!Number.isFinite(n) || n < 0) {
      return { ok: false, error: "見積金額は 0 以上の数値で入力してください" };
    }
    quotedAmount = Math.floor(n);
  }

  const supabase = createAdminClient();
  const patch: Record<string, unknown> = {
    status: args.status,
    internal_notes: args.internalNotes || null,
    quoted_amount: quotedAmount,
    updated_at: new Date().toISOString(),
  };
  if (args.status === "quoted" && quotedAmount !== null) {
    patch.quoted_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("inquiries")
    .update(patch)
    .eq("id", args.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/inquiries/${args.id}`);
  revalidatePath("/admin/inquiries");
  revalidatePath("/admin/dashboard");
  return { ok: true };
}
