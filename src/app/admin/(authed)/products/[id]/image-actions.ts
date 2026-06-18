"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

const BUCKET = "product-images";
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export type UploadImagesResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

export type SimpleResult = { ok: true } | { ok: false; error: string };

async function revalidateProductPaths(
  productId: string,
  handle: string | null | undefined,
) {
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/images");
  if (handle) revalidatePath(`/products/${handle}`);
  revalidatePath("/catalog");
  revalidatePath("/");
}

export async function uploadProductImages(
  productId: string,
  formData: FormData,
): Promise<UploadImagesResult> {
  await requireAdmin();
  const files = formData
    .getAll("images")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) {
    return { ok: false, error: "ファイルが選択されていません" };
  }

  const supabase = createAdminClient();

  const { data: product } = await supabase
    .from("products")
    .select("handle")
    .eq("id", productId)
    .maybeSingle();
  if (!product) {
    return { ok: false, error: "商品が見つかりません" };
  }

  const { data: existing } = await supabase
    .from("product_images")
    .select("sort_order, is_primary")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1);
  let nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;
  const hasAnyExisting = (existing?.length ?? 0) > 0;
  const anyPrimaryExists =
    hasAnyExisting && (existing?.[0]?.is_primary ?? false);

  let count = 0;
  let madePrimary = anyPrimaryExists;

  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      return { ok: false, error: `${file.name}: 5MB を超えています` };
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return {
        ok: false,
        error: `${file.name}: jpg / png / webp / avif のみ対応`,
      };
    }

    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
    const path = `${product.handle}/${Date.now()}-${nextOrder}.${ext}`;
    const buf = await file.arrayBuffer();

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, buf, { contentType: file.type, upsert: false });
    if (upErr) {
      return { ok: false, error: `アップロード失敗: ${upErr.message}` };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);

    const shouldBePrimary = !madePrimary;

    const { error: insErr } = await supabase.from("product_images").insert({
      product_id: productId,
      url: publicUrl,
      sort_order: nextOrder,
      is_primary: shouldBePrimary,
    });
    if (insErr) {
      // ストレージ側だけ残らないように消しておく
      await supabase.storage.from(BUCKET).remove([path]);
      return { ok: false, error: `DB 登録失敗: ${insErr.message}` };
    }

    if (shouldBePrimary) madePrimary = true;
    nextOrder++;
    count++;
  }

  await revalidateProductPaths(productId, product.handle);
  return { ok: true, count };
}

export async function deleteProductImage(
  imageId: string,
): Promise<SimpleResult> {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: img } = await supabase
    .from("product_images")
    .select("id, url, product_id, is_primary")
    .eq("id", imageId)
    .maybeSingle();
  if (!img) return { ok: false, error: "画像が見つかりません" };

  // Storage パスを URL から抽出（例: ".../product-images/handle/123.jpg"）
  const match = img.url.match(/\/product-images\/(.+)$/);
  if (match && match[1]) {
    await supabase.storage.from(BUCKET).remove([match[1]]);
  }

  await supabase.from("product_images").delete().eq("id", imageId);

  // メインを消した場合、残った先頭画像を自動でメインに昇格
  if (img.is_primary) {
    const { data: rest } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", img.product_id)
      .order("sort_order", { ascending: true })
      .limit(1);
    if (rest && rest[0]) {
      await supabase
        .from("product_images")
        .update({ is_primary: true })
        .eq("id", rest[0].id);
    }
  }

  const { data: product } = await supabase
    .from("products")
    .select("handle")
    .eq("id", img.product_id)
    .maybeSingle();
  await revalidateProductPaths(img.product_id, product?.handle);
  return { ok: true };
}

/** 既存画像を新しいファイルで差し替える（URL を更新し、古いファイルは削除） */
export async function replaceProductImage(
  imageId: string,
  formData: FormData,
): Promise<SimpleResult> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "ファイルが選択されていません" };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: "5MB を超えています" };
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return { ok: false, error: "jpg / png / webp / avif のみ対応" };
  }

  const supabase = createAdminClient();
  const { data: img } = await supabase
    .from("product_images")
    .select("id, url, product_id")
    .eq("id", imageId)
    .maybeSingle();
  if (!img) return { ok: false, error: "画像が見つかりません" };

  const { data: product } = await supabase
    .from("products")
    .select("handle")
    .eq("id", img.product_id)
    .maybeSingle();
  const handle = product?.handle ?? "unknown";

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const newPath = `${handle}/replace-${imageId.slice(0, 8)}-${ext}.${ext}`;
  const buf = await file.arrayBuffer();

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(newPath, buf, { contentType: file.type, upsert: true });
  if (upErr) {
    return { ok: false, error: `アップロード失敗: ${upErr.message}` };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(newPath);

  const { error: updErr } = await supabase
    .from("product_images")
    .update({ url: publicUrl })
    .eq("id", imageId);
  if (updErr) {
    await supabase.storage.from(BUCKET).remove([newPath]);
    return { ok: false, error: `DB 更新失敗: ${updErr.message}` };
  }

  // 古いファイルを削除（自社 Storage のものだけ。外部URL参照だった場合は対象外）
  const oldMatch = img.url.match(/\/product-images\/(.+)$/);
  if (oldMatch && oldMatch[1] && oldMatch[1] !== newPath) {
    await supabase.storage.from(BUCKET).remove([oldMatch[1]]);
  }

  await revalidateProductPaths(img.product_id, product?.handle);
  return { ok: true };
}

export async function setPrimaryProductImage(
  imageId: string,
): Promise<SimpleResult> {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: img } = await supabase
    .from("product_images")
    .select("product_id")
    .eq("id", imageId)
    .maybeSingle();
  if (!img) return { ok: false, error: "画像が見つかりません" };

  await supabase
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", img.product_id);
  await supabase
    .from("product_images")
    .update({ is_primary: true })
    .eq("id", imageId);

  const { data: product } = await supabase
    .from("products")
    .select("handle")
    .eq("id", img.product_id)
    .maybeSingle();
  await revalidateProductPaths(img.product_id, product?.handle);
  return { ok: true };
}
