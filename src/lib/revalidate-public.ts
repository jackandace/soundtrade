import { revalidatePath, revalidateTag } from "next/cache";

/**
 * 公開サイト（ISR/キャッシュ済み）を即時更新する。
 * 管理画面で商品・カテゴリ・画像が変わる操作の後に Server Action から呼ぶこと。
 * これにより ISR キャッシュでも管理更新がすぐ反映される。
 */
export function revalidatePublic() {
  // データタグ（getCategoryNav 等の unstable_cache）
  revalidateTag("products");
  revalidateTag("categories");
  // フルルートのISRキャッシュ
  revalidatePath("/");
  revalidatePath("/categories");
  revalidatePath("/catalog");
  revalidatePath("/products/[handle]", "page");
}
