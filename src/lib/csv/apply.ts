import type { SupabaseClient } from "@supabase/supabase-js";

type StagingProduct = {
  id: string;
  handle: string;
  sku_base: string;
  product_name: string | null;
  maker: string | null;
  category_l1: string | null;
  category_l2: string | null;
  category_l3: string | null;
  description_short: string | null;
  description_long: string | null;
  body_html: string | null;
  msrp: number | null;
  msrp_incl_tax: number | null;
  status: string | null;
  tags: string | null;
  seo_title: string | null;
  seo_description: string | null;
  catalog_year: string | null;
};

type StagingVariant = {
  handle: string;
  variant_sku: string;
  variant_name: string | null;
  color_hex: string | null;
  variant_image: string | null;
  stock_status: string | null;
  stock_qty: number | null;
  msrp_variant: number | null;
  weight_kg: number | null;
  barcode: string | null;
  sort_order: number | null;
};

type StagingSpec = {
  handle: string;
  spec_key: string;
  spec_label: string | null;
  spec_value: string | null;
  spec_group: string | null;
  sort_order: number | null;
  is_filterable: boolean | null;
};

export type ApplyResult =
  | {
      ok: true;
      snapshotId: string;
      productsAffected: number;
      variantsAffected: number;
      specsAffected: number;
    }
  | { ok: false; error: string };

const VALID_STOCK_STATUS = new Set(["in", "order", "out"]);

export async function applyImport(
  supabase: SupabaseClient,
  jobId: string,
  adminId: string,
): Promise<ApplyResult> {
  const now = new Date().toISOString();

  // 1. job を approved → applying に更新
  const { error: statusErr } = await supabase
    .from("import_jobs")
    .update({ status: "applying", approved_at: now })
    .eq("id", jobId);
  if (statusErr) {
    return { ok: false, error: `ジョブ状態更新失敗: ${statusErr.message}` };
  }

  // 2. 反映前スナップショット
  const { data: snapshotIdRaw, error: snapErr } = await supabase.rpc(
    "create_product_snapshot",
    {
      p_snapshot_type: "pre_import",
      p_triggered_by: adminId,
      p_related_job: jobId,
      p_notes: `CSV取込 反映前 (job: ${jobId})`,
    },
  );
  if (snapErr || !snapshotIdRaw) {
    await supabase
      .from("import_jobs")
      .update({ status: "failed" })
      .eq("id", jobId);
    return {
      ok: false,
      error: `スナップショット作成失敗: ${snapErr?.message ?? "unknown"}`,
    };
  }
  const snapshotId = String(snapshotIdRaw);
  await supabase
    .from("import_jobs")
    .update({ snapshot_id_before: snapshotId, applied_at: now })
    .eq("id", jobId);

  try {
    // 3. ステージング行を読込
    const [
      { data: stagingProducts },
      { data: stagingVariants },
      { data: stagingSpecs },
    ] = await Promise.all([
      supabase.from("products_staging").select("*").eq("import_job_id", jobId),
      supabase.from("variants_staging").select("*").eq("import_job_id", jobId),
      supabase
        .from("product_specs_staging")
        .select("*")
        .eq("import_job_id", jobId),
    ]);

    const sProducts = (stagingProducts ?? []) as StagingProduct[];
    const sVariants = (stagingVariants ?? []) as StagingVariant[];
    const sSpecs = (stagingSpecs ?? []) as StagingSpec[];

    if (sProducts.length === 0) {
      throw new Error("反映する商品がありません");
    }

    // 4. products UPSERT (onConflict: handle)
    const productPayload = sProducts.map((p) => ({
      handle: p.handle,
      sku_base: p.sku_base || p.handle.toUpperCase(),
      product_name: p.product_name ?? p.handle,
      maker: p.maker,
      category_l1: p.category_l1,
      category_l2: p.category_l2,
      category_l3: p.category_l3,
      description_short: p.description_short,
      description_long: p.description_long,
      body_html: p.body_html,
      msrp: p.msrp,
      msrp_incl_tax: p.msrp_incl_tax,
      status: p.status ?? "draft",
      updated_at: new Date().toISOString(),
    }));

    const { data: upsertedProducts, error: upErr } = await supabase
      .from("products")
      .upsert(productPayload, { onConflict: "handle" })
      .select("id, handle");
    if (upErr || !upsertedProducts) {
      throw new Error(`products UPSERT 失敗: ${upErr?.message ?? "unknown"}`);
    }

    const productIdByHandle = new Map<string, string>();
    for (const p of upsertedProducts) {
      productIdByHandle.set(p.handle, p.id);
    }

    // 5. variants UPSERT (onConflict: variant_sku)
    let variantsAffected = 0;
    if (sVariants.length > 0) {
      const variantPayload = sVariants
        .map((v) => {
          const productId = productIdByHandle.get(v.handle);
          if (!productId) return null;
          const stockStatus =
            v.stock_status && VALID_STOCK_STATUS.has(v.stock_status)
              ? v.stock_status
              : "order";
          return {
            product_id: productId,
            handle: v.handle,
            variant_sku: v.variant_sku,
            variant_name: v.variant_name,
            color_hex: v.color_hex,
            variant_image: v.variant_image,
            stock_status: stockStatus,
            stock_qty: v.stock_qty ?? 0,
            msrp_variant: v.msrp_variant,
            weight_kg: v.weight_kg,
            barcode: v.barcode,
            sort_order: v.sort_order ?? 0,
            updated_at: new Date().toISOString(),
          };
        })
        .filter((v): v is NonNullable<typeof v> => v !== null);

      if (variantPayload.length > 0) {
        const { error: vErr } = await supabase
          .from("variants")
          .upsert(variantPayload, { onConflict: "variant_sku" });
        if (vErr) throw new Error(`variants UPSERT 失敗: ${vErr.message}`);
        variantsAffected = variantPayload.length;
      }
    }

    // 6. product_specs は対象 product_id ぶんを全削除 → 再 INSERT
    const touchedProductIds = Array.from(productIdByHandle.values());
    let specsAffected = 0;
    if (touchedProductIds.length > 0) {
      await supabase
        .from("product_specs")
        .delete()
        .in("product_id", touchedProductIds);

      if (sSpecs.length > 0) {
        const specPayload = sSpecs
          .map((s) => {
            const productId = productIdByHandle.get(s.handle);
            if (!productId) return null;
            return {
              product_id: productId,
              handle: s.handle,
              spec_key: s.spec_key,
              spec_label: s.spec_label,
              spec_value: s.spec_value,
              spec_group: s.spec_group,
              sort_order: s.sort_order ?? 0,
              is_filterable: s.is_filterable ?? false,
            };
          })
          .filter((s): s is NonNullable<typeof s> => s !== null);

        if (specPayload.length > 0) {
          const chunk = 500;
          for (let i = 0; i < specPayload.length; i += chunk) {
            const { error: sErr } = await supabase
              .from("product_specs")
              .insert(specPayload.slice(i, i + chunk));
            if (sErr) throw new Error(`specs INSERT 失敗: ${sErr.message}`);
          }
          specsAffected = specPayload.length;
        }
      }
    }

    // 7. 反映後スナップショットも作っておく（ロールバックの両端を確定させる）
    const { data: snapshotAfterRaw } = await supabase.rpc(
      "create_product_snapshot",
      {
        p_snapshot_type: "post_import",
        p_triggered_by: adminId,
        p_related_job: jobId,
        p_notes: `CSV取込 反映後 (job: ${jobId})`,
      },
    );
    const snapshotIdAfter = snapshotAfterRaw ? String(snapshotAfterRaw) : null;

    // 8. 監査ログ
    await supabase.rpc("write_audit_log", {
      p_action: "import.apply",
      p_resource_type: "import_jobs",
      p_resource_id: jobId,
      p_payload: {
        snapshot_id: snapshotId,
        products_affected: productPayload.length,
        variants_affected: variantsAffected,
        specs_affected: specsAffected,
      },
      p_risk_level: "high",
    });

    // 9. ジョブ完了
    await supabase
      .from("import_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        snapshot_id_after: snapshotIdAfter,
        new_products: productPayload.length,
      })
      .eq("id", jobId);

    return {
      ok: true,
      snapshotId,
      productsAffected: productPayload.length,
      variantsAffected,
      specsAffected,
    };
  } catch (e) {
    const errMsg = (e as Error).message;
    await supabase
      .from("import_jobs")
      .update({ status: "failed" })
      .eq("id", jobId);
    await supabase.rpc("write_audit_log", {
      p_action: "import.apply_failed",
      p_resource_type: "import_jobs",
      p_resource_id: jobId,
      p_payload: { snapshot_id: snapshotId, error: errMsg },
      p_risk_level: "high",
    });
    return {
      ok: false,
      error: `反映に失敗しました: ${errMsg}（スナップショット ${snapshotId} が残っているのでロールバック可能）`,
    };
  }
}
