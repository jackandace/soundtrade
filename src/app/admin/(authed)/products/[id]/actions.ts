"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

const VALID_STATUSES = ["active", "draft", "archived"] as const;

export type UpdateProductArgs = {
  id: string;
  productName: string;
  status: string;
  maker: string;
  categoryL1: string;
  categoryL2: string;
  categoryL3: string;
  descriptionShort: string;
  descriptionLong: string;
};

export type UpdateProductResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateProduct(
  args: UpdateProductArgs,
): Promise<UpdateProductResult> {
  await requireAdmin();

  if (!args.productName.trim()) {
    return { ok: false, error: "商品名は必須です" };
  }
  if (!VALID_STATUSES.includes(args.status as (typeof VALID_STATUSES)[number])) {
    return { ok: false, error: "ステータスの値が不正です" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("products")
    .update({
      product_name: args.productName.trim(),
      status: args.status,
      maker: args.maker || null,
      category_l1: args.categoryL1 || null,
      category_l2: args.categoryL2 || null,
      category_l3: args.categoryL3 || null,
      description_short: args.descriptionShort || null,
      description_long: args.descriptionLong || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", args.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/products/${args.id}`);
  revalidatePath("/admin/products");
  revalidatePath("/catalog");
  return { ok: true };
}
