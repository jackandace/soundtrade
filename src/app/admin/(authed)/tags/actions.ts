"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { parseTags, joinTags } from "@/lib/tags";
import { revalidatePublic } from "@/lib/revalidate-public";

export type SimpleResult = { ok: true } | { ok: false; error: string };

function revalidateAll() {
  revalidatePath("/admin/tags");
  revalidatePath("/admin/products");
  revalidatePublic();
}

/** タグを語彙として登録（tag_master へ追加） */
export async function createTag(name: string): Promise<SimpleResult> {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "タグ名を入力してください" };
  if (trimmed.includes(",")) {
    return { ok: false, error: "タグ名にカンマは使えません" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("tag_master")
    .insert({ name: trimmed });
  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "そのタグは既に登録されています" };
    }
    return { ok: false, error: error.message };
  }
  revalidateAll();
  return { ok: true };
}

/** タグ名を変更（tag_master と、使用中の全商品の tags を一括で書き換え） */
export async function renameTag(
  oldName: string,
  newName: string,
): Promise<SimpleResult> {
  await requireAdmin();
  const from = oldName.trim();
  const to = newName.trim();
  if (!to) return { ok: false, error: "新しいタグ名を入力してください" };
  if (to.includes(",")) return { ok: false, error: "タグ名にカンマは使えません" };
  if (from === to) return { ok: true };

  const supabase = createAdminClient();

  // tag_master 側（登録されていれば）更新
  await supabase.from("tag_master").update({ name: to }).eq("name", from);

  // 使用中の商品の tags を書き換え
  const { data: affected } = await supabase
    .from("products")
    .select("id, tags")
    .ilike("tags", `%${from}%`);
  for (const p of affected ?? []) {
    const list = parseTags(p.tags);
    if (!list.includes(from)) continue;
    const next = list.map((t) => (t === from ? to : t));
    // 重複を除去
    const deduped = Array.from(new Set(next));
    await supabase
      .from("products")
      .update({ tags: joinTags(deduped) || null })
      .eq("id", p.id);
  }

  revalidateAll();
  return { ok: true };
}

/** タグを削除。stripFromProducts=true で使用中の商品からも除去 */
export async function deleteTag(
  name: string,
  stripFromProducts: boolean,
): Promise<SimpleResult> {
  await requireAdmin();
  const target = name.trim();
  if (!target) return { ok: false, error: "タグ名が不正です" };

  const supabase = createAdminClient();
  await supabase.from("tag_master").delete().eq("name", target);

  if (stripFromProducts) {
    const { data: affected } = await supabase
      .from("products")
      .select("id, tags")
      .ilike("tags", `%${target}%`);
    for (const p of affected ?? []) {
      const list = parseTags(p.tags);
      if (!list.includes(target)) continue;
      const next = list.filter((t) => t !== target);
      await supabase
        .from("products")
        .update({ tags: joinTags(next) || null })
        .eq("id", p.id);
    }
  }

  revalidateAll();
  return { ok: true };
}
