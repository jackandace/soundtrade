import type { SupabaseClient } from "@supabase/supabase-js";
import { validateRows } from "./validate";
import type { ParsedImport, ProductRow, VariantRow, SpecRow } from "./types";

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
  msrp_variant: number | null;
  stock_status: string | null;
  stock_qty: number | null;
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

export async function revalidateJob(
  supabase: SupabaseClient,
  jobId: string,
): Promise<{
  total: number;
  errors: number;
  warnings: number;
}> {
  const [{ data: products }, { data: variants }, { data: specs }] = await Promise.all([
    supabase.from("products_staging").select("*").eq("import_job_id", jobId),
    supabase.from("variants_staging").select("*").eq("import_job_id", jobId),
    supabase.from("product_specs_staging").select("*").eq("import_job_id", jobId),
  ]);

  const productRows: ProductRow[] = (products ?? []).map((p: StagingProduct, i) => ({
    rowNumber: i + 1,
    handle: p.handle,
    sku_base: p.sku_base,
    product_name: p.product_name,
    maker: p.maker,
    category_l1: p.category_l1,
    category_l2: p.category_l2,
    category_l3: p.category_l3,
    description_short: p.description_short,
    description_long: p.description_long,
    body_html: p.body_html,
    msrp: p.msrp,
    msrp_incl_tax: p.msrp_incl_tax,
    status: p.status,
    tags: p.tags,
    seo_title: p.seo_title,
    seo_description: p.seo_description,
    catalog_year: p.catalog_year,
  }));

  const variantRows: VariantRow[] = (variants ?? []).map((v: StagingVariant, i) => ({
    rowNumber: i + 1,
    handle: v.handle,
    variant_sku: v.variant_sku,
    variant_name: v.variant_name,
    msrp_variant: v.msrp_variant,
    stock_status: v.stock_status,
    stock_qty: v.stock_qty,
    sort_order: v.sort_order,
  }));

  const specRows: SpecRow[] = (specs ?? []).map((s: StagingSpec, i) => ({
    rowNumber: i + 1,
    handle: s.handle,
    spec_key: s.spec_key,
    spec_label: s.spec_label,
    spec_value: s.spec_value,
    spec_group: s.spec_group,
    sort_order: s.sort_order,
    is_filterable: s.is_filterable,
  }));

  const parsed: ParsedImport = {
    jobType: "split_csv",
    products: productRows,
    variants: variantRows,
    specs: specRows,
    schemaIssues: [],
  };

  const issues = validateRows(parsed);

  const stagingIdByHandle = new Map<string, string>();
  for (const p of (products ?? []) as StagingProduct[]) {
    stagingIdByHandle.set(p.handle, p.id);
  }

  // 既存の import_errors を全削除して入れ直す
  await supabase.from("import_errors").delete().eq("import_job_id", jobId);

  if (issues.length > 0) {
    const chunk = 500;
    for (let i = 0; i < issues.length; i += chunk) {
      await supabase.from("import_errors").insert(
        issues.slice(i, i + chunk).map((it) => ({
          import_job_id: jobId,
          staging_product_id: it.handle ? (stagingIdByHandle.get(it.handle) ?? null) : null,
          severity: it.severity,
          error_code: it.code,
          row_number: it.rowNumber,
          field_name: it.fieldName,
          field_value: it.fieldValue,
          message: it.message,
          suggestion: it.suggestion,
        })),
      );
    }
  }

  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;
  const total = productRows.length;
  const validRows = Math.max(0, total - errors);

  await supabase
    .from("import_jobs")
    .update({
      total_rows: total,
      valid_rows: validRows,
      warning_rows: warnings,
      error_rows: errors,
      status: errors === 0 ? "reviewing" : "reviewing",
    })
    .eq("id", jobId);

  return { total, errors, warnings };
}
