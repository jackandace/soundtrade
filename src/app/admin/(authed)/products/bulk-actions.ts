"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { parseTags, joinTags } from "@/lib/tags";

export type BulkResult =
  | { ok: true; affected: number }
  | { ok: false; error: string };

async function applyToProducts(
  productIds: string[],
  tagName: string,
  mode: "add" | "remove",
): Promise<BulkResult> {
  await requireAdmin();
  const tag = tagName.trim();
  if (!tag) return { ok: false, error: "タグを指定してください" };
  if (tag.includes(",")) {
    return { ok: false, error: "タグ名にカンマは使えません" };
  }
  if (productIds.length === 0) {
    return { ok: false, error: "商品が選択されていません" };
  }

  const supabase = createAdminClient();
  const { data: rows, error } = await supabase
    .from("products")
    .select("id, tags")
    .in("id", productIds);
  if (error) return { ok: false, error: error.message };

  let affected = 0;
  for (const p of rows ?? []) {
    const list = parseTags(p.tags);
    const has = list.includes(tag);
    let next: string[];
    if (mode === "add") {
      if (has) continue;
      next = [...list, tag];
    } else {
      if (!has) continue;
      next = list.filter((t) => t !== tag);
    }
    const { error: updErr } = await supabase
      .from("products")
      .update({ tags: joinTags(next) || null, updated_at: new Date().toISOString() })
      .eq("id", p.id);
    if (updErr) return { ok: false, error: updErr.message };
    affected++;
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin/tags");
  revalidatePath("/catalog");
  revalidatePath("/");
  return { ok: true, affected };
}

export async function bulkAddTag(
  productIds: string[],
  tagName: string,
): Promise<BulkResult> {
  return applyToProducts(productIds, tagName, "add");
}

export async function bulkRemoveTag(
  productIds: string[],
  tagName: string,
): Promise<BulkResult> {
  return applyToProducts(productIds, tagName, "remove");
}
