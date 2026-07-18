"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

export type CustomerResult = { ok: true } | { ok: false; error: string };

/** 顧客のブロック状態・社内メモを更新 */
export async function updateCustomer(args: {
  id: string;
  isBlocked: boolean;
  blockedReason: string;
  notes: string;
}): Promise<CustomerResult> {
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("customers")
    .update({
      is_blocked: args.isBlocked,
      blocked_reason: args.blockedReason.trim() || null,
      notes: args.notes.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", args.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/customers/${args.id}`);
  revalidatePath("/admin/customers");
  return { ok: true };
}

/** ドメインをブロックリストに追加（例: sales-spam.co.jp） */
export async function blockDomain(
  domain: string,
  reason: string,
): Promise<CustomerResult> {
  await requireAdmin();
  const d = domain.trim().toLowerCase().replace(/^@/, "");
  if (!d || !d.includes(".") || /\s/.test(d)) {
    return { ok: false, error: "ドメインの形式が正しくありません（例: example.co.jp）" };
  }
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("blocked_domains")
    .upsert({ domain: d, reason: reason.trim() || null }, { onConflict: "domain" });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/customers");
  revalidatePath("/admin/customers/blocklist");
  return { ok: true };
}

/** ドメインブロックを解除 */
export async function unblockDomain(id: string): Promise<CustomerResult> {
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("blocked_domains").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/customers/blocklist");
  return { ok: true };
}
