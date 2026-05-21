import Papa from "papaparse";
import type {
  ParsedImport,
  ProductRow,
  VariantRow,
  SpecRow,
  ValidationIssue,
} from "./types";

const REQ_SHOPIFY = ["Handle", "Title", "Vendor", "Variant SKU", "Variant Price", "Status"];
const REQ_PRODUCTS_B = ["handle", "sku_base", "product_name", "maker", "status"];

function str(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function intOrNull(v: unknown): number | null {
  if (v === undefined || v === null) return null;
  const s = String(v).replace(/,/g, "").trim();
  if (s === "") return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return Math.floor(n);
}

function boolOrNull(v: unknown): boolean | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim().toLowerCase();
  if (s === "1" || s === "true") return true;
  if (s === "0" || s === "false") return false;
  return null;
}

function readHeaders(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const cleaned = text.replace(/^﻿/, "");
  const result = Papa.parse<Record<string, string>>(cleaned, {
    header: true,
    skipEmptyLines: true,
  });
  return { headers: result.meta.fields ?? [], rows: result.data };
}

export function parseShopifyCsv(text: string): ParsedImport {
  const schemaIssues: ValidationIssue[] = [];
  const { headers, rows } = readHeaders(text);

  for (const col of REQ_SHOPIFY) {
    if (!headers.includes(col)) {
      schemaIssues.push({
        severity: "error",
        code: "CSV_SCHEMA_MISMATCH",
        rowNumber: null,
        fieldName: col,
        fieldValue: null,
        message: `必須カラム '${col}' がありません`,
        suggestion: "shopify_*.csv の標準フォーマットでお試しください",
        handle: null,
      });
    }
  }

  if (schemaIssues.length > 0) {
    return { jobType: "shopify_csv", products: [], variants: [], specs: [], schemaIssues };
  }

  const products: ProductRow[] = [];
  const variants: VariantRow[] = [];
  const seen = new Set<string>();

  rows.forEach((row, i) => {
    const rowNumber = i + 2;
    const handle = str(row["Handle"]) ?? "";
    if (!handle) return;

    if (!seen.has(handle)) {
      seen.add(handle);
      const priceIncl = intOrNull(row["Variant Price"]);
      const priceExcl = priceIncl != null ? Math.round(priceIncl / 1.1) : null;
      const tagsRaw = str(row["Tags"]) ?? "";
      const tagList = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);

      products.push({
        rowNumber,
        handle,
        sku_base: str(row["Variant SKU"]) ?? handle.toUpperCase(),
        product_name: str(row["Title"]),
        maker: str(row["Vendor"]),
        category_l1: "管楽器",
        category_l2: str(row["Type"]),
        category_l3: tagList[1] ?? null,
        description_short: null,
        description_long: null,
        body_html: str(row["Body (HTML)"]),
        msrp: priceExcl,
        msrp_incl_tax: priceIncl,
        status: str(row["Status"]),
        tags: tagsRaw,
        seo_title: str(row["SEO Title"]),
        seo_description: str(row["SEO Description"]),
        catalog_year: null,
      });
    }

    const sku = str(row["Variant SKU"]);
    if (sku) {
      const priceIncl = intOrNull(row["Variant Price"]);
      const priceExcl = priceIncl != null ? Math.round(priceIncl / 1.1) : null;
      variants.push({
        rowNumber,
        handle,
        variant_sku: sku,
        variant_name: str(row["Option1 Value"]),
        msrp_variant: priceExcl,
        stock_status: "order",
        stock_qty: intOrNull(row["Variant Inventory Qty"]),
        sort_order: null,
      });
    }
  });

  return { jobType: "shopify_csv", products, variants, specs: [], schemaIssues };
}

export function parseSplitCsv(files: { name: string; text: string }[]): ParsedImport {
  const schemaIssues: ValidationIssue[] = [];

  const productsFile = files.find((f) => /products[_-]/i.test(f.name));
  const variantsFile = files.find((f) => /variants[_-]/i.test(f.name));
  const specsFile = files.find((f) => /(product_)?specs[_-]/i.test(f.name));

  const products: ProductRow[] = [];
  const variants: VariantRow[] = [];
  const specs: SpecRow[] = [];

  if (!productsFile) {
    schemaIssues.push({
      severity: "error",
      code: "CSV_SCHEMA_MISMATCH",
      rowNumber: null,
      fieldName: null,
      fieldValue: null,
      message: "products_*.csv が見つかりません",
      suggestion: "Pattern B では products_*.csv が必須です",
      handle: null,
    });
  } else {
    const { headers, rows } = readHeaders(productsFile.text);
    for (const col of REQ_PRODUCTS_B) {
      if (!headers.includes(col)) {
        schemaIssues.push({
          severity: "error",
          code: "CSV_SCHEMA_MISMATCH",
          rowNumber: null,
          fieldName: col,
          fieldValue: null,
          message: `products_*.csv: 必須カラム '${col}' がありません`,
          suggestion: null,
          handle: null,
        });
      }
    }
    if (schemaIssues.length === 0) {
      rows.forEach((row, i) => {
        const rowNumber = i + 2;
        const handle = str(row["handle"]);
        if (!handle) return;
        const msrp = intOrNull(row["msrp"]);
        products.push({
          rowNumber,
          handle,
          sku_base: str(row["sku_base"]) ?? handle.toUpperCase(),
          product_name: str(row["product_name"]),
          maker: str(row["maker"]),
          category_l1: str(row["category_l1"]),
          category_l2: str(row["category_l2"]),
          category_l3: str(row["category_l3"]),
          description_short: str(row["description_short"]),
          description_long: str(row["description_long"]),
          body_html: null,
          msrp,
          msrp_incl_tax: msrp != null ? Math.round(msrp * 1.1) : null,
          status: str(row["status"]),
          tags: str(row["tags"]),
          seo_title: str(row["seo_title"]),
          seo_description: str(row["seo_description"]),
          catalog_year: str(row["catalog_year"]),
        });
      });
    }
  }

  if (variantsFile && schemaIssues.length === 0) {
    const { rows } = readHeaders(variantsFile.text);
    rows.forEach((row, i) => {
      const rowNumber = i + 2;
      const handle = str(row["handle"]);
      const sku = str(row["variant_sku"]);
      if (!handle || !sku) return;
      variants.push({
        rowNumber,
        handle,
        variant_sku: sku,
        variant_name: str(row["variant_name"]),
        msrp_variant: intOrNull(row["msrp_variant"]),
        stock_status: str(row["stock_status"]),
        stock_qty: intOrNull(row["stock_qty"]),
        sort_order: intOrNull(row["sort_order"]),
      });
    });
  }

  if (specsFile && schemaIssues.length === 0) {
    const { rows } = readHeaders(specsFile.text);
    rows.forEach((row, i) => {
      const rowNumber = i + 2;
      const handle = str(row["handle"]);
      const key = str(row["spec_key"]);
      const value = str(row["spec_value"]);
      if (!handle || !key || !value) return;
      specs.push({
        rowNumber,
        handle,
        spec_key: key,
        spec_label: str(row["spec_label"]),
        spec_value: value,
        spec_group: str(row["spec_group"]),
        sort_order: intOrNull(row["sort_order"]),
        is_filterable: boolOrNull(row["is_filterable"]),
      });
    });
  }

  return { jobType: "split_csv", products, variants, specs, schemaIssues };
}
