"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { parseImportFiles } from "@/lib/csv/import-parse";
import { validateRows } from "@/lib/csv/validate";
import type { ParsedImport } from "@/lib/csv/types";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export type SubmitImportResult =
  | { ok: true; jobId: string }
  | { ok: false; error: string };

export async function submitImport(
  formData: FormData,
): Promise<SubmitImportResult> {
  const admin = await requireAdmin();

  // 形式は問わず、アップロードされた全ファイル（csv / xlsx）を受け付けて自動判定
  const files = formData
    .getAll("files")
    .filter((v): v is File => v instanceof File && v.size > 0);

  if (files.length === 0) {
    return { ok: false, error: "ファイルが選択されていません" };
  }
  for (const f of files) {
    if (f.size > MAX_FILE_BYTES) {
      return { ok: false, error: `${f.name}: ファイルサイズが 10MB を超えています` };
    }
    const lower = f.name.toLowerCase();
    if (!lower.endsWith(".csv") && !lower.endsWith(".xlsx")) {
      return {
        ok: false,
        error: `${f.name}: Excel(.xlsx) か CSV(.csv) のファイルをアップロードしてください`,
      };
    }
  }

  const sourceName = files.map((f) => f.name).join(" + ");
  const sourceSize = files.reduce((s, f) => s + f.size, 0);

  let parsed: ParsedImport;
  try {
    parsed = await parseImportFiles(files);
  } catch (e) {
    return {
      ok: false,
      error: `ファイルの読み取りに失敗しました: ${(e as Error).message}`,
    };
  }

  const supabase = createAdminClient();
  const { data: job, error: jobErr } = await supabase
    .from("import_jobs")
    .insert({
      job_type: parsed.jobType,
      source_filename: sourceName,
      source_size: sourceSize,
      uploaded_by: admin.id,
      uploader_name: admin.display_name,
      uploader_role: admin.role,
      status: "validating",
      total_rows: parsed.products.length,
    })
    .select("id")
    .single();

  if (jobErr || !job) {
    return { ok: false, error: jobErr?.message ?? "ジョブ作成に失敗しました" };
  }

  const issues = [...parsed.schemaIssues];

  if (parsed.schemaIssues.length === 0 && parsed.products.length > 0) {
    const { error: prodErr } = await supabase.from("products_staging").insert(
      parsed.products.map((p) => ({
        import_job_id: job.id,
        handle: p.handle,
        sku_base: p.sku_base || p.handle.toUpperCase(),
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
      })),
    );
    if (prodErr) {
      await supabase
        .from("import_jobs")
        .update({ status: "failed" })
        .eq("id", job.id);
      return { ok: false, error: `staging 書込失敗: ${prodErr.message}` };
    }

    if (parsed.variants.length > 0) {
      await supabase.from("variants_staging").insert(
        parsed.variants.map((v) => ({
          import_job_id: job.id,
          handle: v.handle,
          variant_sku: v.variant_sku,
          variant_name: v.variant_name,
          msrp_variant: v.msrp_variant,
          stock_status: v.stock_status,
          stock_qty: v.stock_qty,
          sort_order: v.sort_order,
        })),
      );
    }

    if (parsed.specs.length > 0) {
      await supabase.from("product_specs_staging").insert(
        parsed.specs.map((s) => ({
          import_job_id: job.id,
          handle: s.handle,
          spec_key: s.spec_key,
          spec_label: s.spec_label,
          spec_value: s.spec_value,
          spec_group: s.spec_group,
          sort_order: s.sort_order,
          is_filterable: s.is_filterable,
        })),
      );
    }

    issues.push(...validateRows(parsed));
  }

  // handle → staging_product_id の対応表を作る（差分プレビュー / 行修正で必要）
  const stagingIdByHandle = new Map<string, string>();
  if (parsed.schemaIssues.length === 0) {
    const { data: stagedRows } = await supabase
      .from("products_staging")
      .select("id, handle")
      .eq("import_job_id", job.id);
    for (const r of stagedRows ?? []) {
      stagingIdByHandle.set(r.handle, r.id);
    }
  }

  if (issues.length > 0) {
    const chunk = 500;
    for (let i = 0; i < issues.length; i += chunk) {
      await supabase.from("import_errors").insert(
        issues.slice(i, i + chunk).map((it) => ({
          import_job_id: job.id,
          staging_product_id: it.handle
            ? (stagingIdByHandle.get(it.handle) ?? null)
            : null,
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

  const errorRows = issues.filter((i) => i.severity === "error").length;
  const warningRows = issues.filter((i) => i.severity === "warning").length;
  const totalRows = parsed.products.length;
  const validRows = Math.max(0, totalRows - errorRows);

  await supabase
    .from("import_jobs")
    .update({
      total_rows: totalRows,
      valid_rows: validRows,
      warning_rows: warningRows,
      error_rows: errorRows,
      status: parsed.schemaIssues.length > 0 ? "failed" : "reviewing",
    })
    .eq("id", job.id);

  return { ok: true, jobId: job.id };
}
