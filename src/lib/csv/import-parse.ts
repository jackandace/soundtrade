import ExcelJS from "exceljs";
import Papa from "papaparse";
import type {
  ParsedImport,
  ProductRow,
  VariantRow,
  SpecRow,
  ValidationIssue,
} from "./types";
import {
  mapHeaders,
  looksLikeShopify,
  normalizeStatus,
  deriveHandle,
  parsePriceInt,
} from "./header-map";

type Extracted = { name: string; headers: string[]; rows: string[][] };

function cellToString(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    if ("text" in v && typeof (v as { text?: unknown }).text === "string") {
      return (v as { text: string }).text;
    }
    if ("result" in v) return String((v as { result: unknown }).result ?? "");
    if ("richText" in v) {
      const rt = (v as { richText: Array<{ text?: string }> }).richText;
      return rt.map((r) => r.text ?? "").join("");
    }
  }
  return String(v);
}

async function extractFile(file: File): Promise<Extracted> {
  const name = file.name;
  if (name.toLowerCase().endsWith(".csv")) {
    const text = (await file.text()).replace(/^﻿/, "");
    const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
    const data = parsed.data;
    const headers = (data[0] ?? []).map((h) => (h ?? "").toString());
    const rows = data.slice(1);
    return { name, headers, rows };
  }
  // xlsx
  const buf = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.worksheets[0];
  if (!ws) return { name, headers: [], rows: [] };
  const headers: string[] = [];
  ws.getRow(1).eachCell({ includeEmpty: true }, (cell, col) => {
    headers[col - 1] = cellToString(cell.value);
  });
  const rows: string[][] = [];
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const arr: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      arr[col - 1] = cellToString(cell.value);
    });
    // 全列空ならスキップ
    if (arr.some((c) => (c ?? "").trim() !== "")) rows.push(arr);
  });
  return { name, headers, rows };
}

function str(v: string | undefined): string | null {
  const s = (v ?? "").trim();
  return s === "" ? null : s;
}

/** 1行=1商品 形式（日本語テンプレート / products_*.csv）を ProductRow へ */
function parseProductsSheet(ex: Extracted): {
  products: ProductRow[];
  issues: ValidationIssue[];
} {
  const map = mapHeaders(ex.headers);
  const issues: ValidationIssue[] = [];
  const products: ProductRow[] = [];

  if (map.product_name === undefined && map.sku_base === undefined) {
    issues.push({
      severity: "error",
      code: "CSV_SCHEMA_MISMATCH",
      rowNumber: null,
      fieldName: null,
      fieldValue: null,
      message:
        "「商品名」または「品番」の列が見つかりません。テンプレートの列名をご確認ください。",
      suggestion: "テンプレートをダウンロードして、その列名のままご利用ください。",
      handle: null,
    });
    return { products, issues };
  }

  ex.rows.forEach((row, i) => {
    const rowNumber = i + 2;
    const sku = str(map.sku_base !== undefined ? row[map.sku_base] : undefined);
    const name = str(
      map.product_name !== undefined ? row[map.product_name] : undefined,
    );
    if (!sku && !name) return; // 空行

    const maker = str(map.maker !== undefined ? row[map.maker] : undefined);
    const skuBase = sku ?? (name ?? "").toUpperCase();
    const handle =
      str(map.handle !== undefined ? row[map.handle] : undefined) ??
      deriveHandle(maker, skuBase);

    // 価格: 税込優先。税抜のみなら税込換算。
    const inclRaw =
      map.msrp_incl_tax !== undefined ? parsePriceInt(row[map.msrp_incl_tax]) : null;
    const exclRaw = map.msrp !== undefined ? parsePriceInt(row[map.msrp]) : null;
    const msrpIncl =
      inclRaw ?? (exclRaw != null ? Math.round(exclRaw * 1.1) : null);
    const msrp =
      exclRaw ?? (inclRaw != null ? Math.round(inclRaw / 1.1) : null);

    products.push({
      rowNumber,
      handle,
      sku_base: skuBase,
      product_name: name,
      maker,
      category_l1: str(map.category_l1 !== undefined ? row[map.category_l1] : undefined),
      category_l2: str(map.category_l2 !== undefined ? row[map.category_l2] : undefined),
      category_l3: str(map.category_l3 !== undefined ? row[map.category_l3] : undefined),
      description_short: str(
        map.description_short !== undefined ? row[map.description_short] : undefined,
      ),
      description_long: str(
        map.description_long !== undefined ? row[map.description_long] : undefined,
      ),
      body_html: null,
      msrp,
      msrp_incl_tax: msrpIncl,
      status:
        normalizeStatus(
          str(map.status !== undefined ? row[map.status] : undefined),
        ) ?? (msrpIncl && msrpIncl > 0 ? "active" : "draft"),
      tags: str(map.tags !== undefined ? row[map.tags] : undefined),
      seo_title: null,
      seo_description: null,
      catalog_year: null,
    });
  });

  return { products, issues };
}

/** Shopify 複数行形式（Handle + バリアント列）を ProductRow + VariantRow へ */
function parseShopifySheet(ex: Extracted): {
  products: ProductRow[];
  variants: VariantRow[];
} {
  const idx = (name: string) =>
    ex.headers.findIndex((h) => h.trim().toLowerCase() === name.toLowerCase());
  const cHandle = idx("Handle");
  const cTitle = idx("Title");
  const cVendor = idx("Vendor");
  const cType = idx("Type");
  const cTags = idx("Tags");
  const cStatus = idx("Status");
  const cBody = idx("Body (HTML)");
  const cSku = idx("Variant SKU");
  const cPrice = idx("Variant Price");
  const cOpt1 = idx("Option1 Value");

  const products: ProductRow[] = [];
  const variants: VariantRow[] = [];
  const seen = new Set<string>();

  ex.rows.forEach((row, i) => {
    const rowNumber = i + 2;
    const handle = str(cHandle >= 0 ? row[cHandle] : undefined);
    if (!handle) return;
    if (!seen.has(handle)) {
      seen.add(handle);
      const incl = cPrice >= 0 ? parsePriceInt(row[cPrice]) : null;
      const tags = str(cTags >= 0 ? row[cTags] : undefined) ?? "";
      const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
      products.push({
        rowNumber,
        handle,
        sku_base: str(cSku >= 0 ? row[cSku] : undefined) ?? handle.toUpperCase(),
        product_name: str(cTitle >= 0 ? row[cTitle] : undefined),
        maker: str(cVendor >= 0 ? row[cVendor] : undefined),
        category_l1: "管楽器",
        category_l2: str(cType >= 0 ? row[cType] : undefined),
        category_l3: tagList[1] ?? null,
        description_short: null,
        description_long: null,
        body_html: str(cBody >= 0 ? row[cBody] : undefined),
        msrp: incl != null ? Math.round(incl / 1.1) : null,
        msrp_incl_tax: incl,
        status:
          normalizeStatus(str(cStatus >= 0 ? row[cStatus] : undefined)) ?? "draft",
        tags,
        seo_title: null,
        seo_description: null,
        catalog_year: null,
      });
    }
    const sku = str(cSku >= 0 ? row[cSku] : undefined);
    if (sku) {
      const incl = cPrice >= 0 ? parsePriceInt(row[cPrice]) : null;
      variants.push({
        rowNumber,
        handle,
        variant_sku: sku,
        variant_name: str(cOpt1 >= 0 ? row[cOpt1] : undefined),
        msrp_variant: incl != null ? Math.round(incl / 1.1) : null,
        stock_status: "order",
        stock_qty: null,
        sort_order: null,
      });
    }
  });
  return { products, variants };
}

/** アップロードされたファイル群を解析（形式は自動判定） */
export async function parseImportFiles(files: File[]): Promise<ParsedImport> {
  const extracted = await Promise.all(files.map(extractFile));

  // Shopify 形式のファイルがあれば最優先
  const shopify = extracted.find((e) => looksLikeShopify(e.headers));
  if (shopify) {
    const { products, variants } = parseShopifySheet(shopify);
    if (products.length === 0) {
      return {
        jobType: "shopify_csv",
        products: [],
        variants: [],
        specs: [],
        schemaIssues: [
          {
            severity: "error",
            code: "CSV_SCHEMA_MISMATCH",
            rowNumber: null,
            fieldName: null,
            fieldValue: null,
            message: "商品データを読み取れませんでした。",
            suggestion: null,
            handle: null,
          },
        ],
      };
    }
    return { jobType: "shopify_csv", products, variants, specs: [], schemaIssues: [] };
  }

  // それ以外は「1行=1商品」として、商品列を持つ最初のファイルを商品マスタ扱い
  const productFile =
    extracted.find((e) => {
      const m = mapHeaders(e.headers);
      return m.product_name !== undefined || m.sku_base !== undefined;
    }) ?? extracted[0];

  if (!productFile) {
    return {
      jobType: "split_csv",
      products: [],
      variants: [],
      specs: [],
      schemaIssues: [
        {
          severity: "error",
          code: "CSV_SCHEMA_MISMATCH",
          rowNumber: null,
          fieldName: null,
          fieldValue: null,
          message: "アップロードされたファイルを読み取れませんでした。",
          suggestion: "テンプレートをダウンロードしてご利用ください。",
          handle: null,
        },
      ],
    };
  }

  const { products, issues } = parseProductsSheet(productFile);

  // variants / specs ファイル（分割版）があれば取り込む
  const variants: VariantRow[] = [];
  const specs: SpecRow[] = [];
  for (const e of extracted) {
    if (e === productFile) continue;
    const h = e.headers.map((x) => x.trim().toLowerCase());
    if (h.includes("variant_sku")) {
      const ch = h.indexOf("handle");
      const cs = h.indexOf("variant_sku");
      const cn = h.indexOf("variant_name");
      const cp = h.indexOf("msrp_variant");
      e.rows.forEach((row, i) => {
        const handle = str(ch >= 0 ? row[ch] : undefined);
        const sku = str(cs >= 0 ? row[cs] : undefined);
        if (!handle || !sku) return;
        variants.push({
          rowNumber: i + 2,
          handle,
          variant_sku: sku,
          variant_name: str(cn >= 0 ? row[cn] : undefined),
          msrp_variant: cp >= 0 ? parsePriceInt(row[cp]) : null,
          stock_status: "order",
          stock_qty: null,
          sort_order: null,
        });
      });
    } else if (h.includes("spec_key")) {
      const ch = h.indexOf("handle");
      const ck = h.indexOf("spec_key");
      const cl = h.indexOf("spec_label");
      const cv = h.indexOf("spec_value");
      const cg = h.indexOf("spec_group");
      e.rows.forEach((row, i) => {
        const handle = str(ch >= 0 ? row[ch] : undefined);
        const key = str(ck >= 0 ? row[ck] : undefined);
        const value = str(cv >= 0 ? row[cv] : undefined);
        if (!handle || !key || !value) return;
        specs.push({
          rowNumber: i + 2,
          handle,
          spec_key: key,
          spec_label: str(cl >= 0 ? row[cl] : undefined),
          spec_value: value,
          spec_group: str(cg >= 0 ? row[cg] : undefined),
          sort_order: null,
          is_filterable: null,
        });
      });
    }
  }

  return {
    jobType: "split_csv",
    products,
    variants,
    specs,
    schemaIssues: issues,
  };
}
