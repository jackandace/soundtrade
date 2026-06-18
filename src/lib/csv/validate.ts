import type { ParsedImport, ValidationIssue } from "./types";

const HANDLE_RE = /^[a-z0-9-]+$/;
const VALID_STATUSES = ["active", "draft", "archived"];

export function validateRows(parsed: ParsedImport): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const handleRows = new Map<string, number[]>();

  for (const p of parsed.products) {
    if (!p.handle) {
      issues.push({
        severity: "error",
        code: "MISSING_HANDLE",
        rowNumber: p.rowNumber,
        fieldName: "品番",
        fieldValue: "",
        message: "品番が空です（商品を識別できません）",
        suggestion: "品番を入力してください",
        handle: null,
      });
    } else if (!HANDLE_RE.test(p.handle)) {
      issues.push({
        severity: "error",
        code: "INVALID_HANDLE_FORMAT",
        rowNumber: p.rowNumber,
        fieldName: "品番",
        fieldValue: p.handle,
        message: `品番から作られるURL用キー '${p.handle}' に使えない文字が含まれています`,
        suggestion: "品番は英数字とハイフンを中心にしてください",
        handle: p.handle,
      });
    } else {
      const arr = handleRows.get(p.handle) ?? [];
      arr.push(p.rowNumber);
      handleRows.set(p.handle, arr);
    }

    if (!p.product_name) {
      issues.push({
        severity: "error",
        code: "MISSING_TITLE",
        rowNumber: p.rowNumber,
        fieldName: "商品名",
        fieldValue: null,
        message: "商品名が空です",
        suggestion: "商品名を入力してください",
        handle: p.handle || null,
      });
    } else if (p.product_name.length > 60) {
      issues.push({
        severity: "warning",
        code: "LONG_TITLE",
        rowNumber: p.rowNumber,
        fieldName: "product_name",
        fieldValue: p.product_name,
        message: `商品名が ${p.product_name.length} 字あります (推奨 60 字以内)`,
        suggestion: "可能であれば短くしてください",
        handle: p.handle,
      });
    }

    if (!p.maker) {
      issues.push({
        severity: "error",
        code: "MISSING_VENDOR",
        rowNumber: p.rowNumber,
        fieldName: "メーカー",
        fieldValue: null,
        message: "メーカーが空です",
        suggestion: "メーカー名を入力してください",
        handle: p.handle,
      });
    }

    if (p.msrp_incl_tax != null && p.msrp_incl_tax < 0) {
      issues.push({
        severity: "error",
        code: "INVALID_PRICE",
        rowNumber: p.rowNumber,
        fieldName: "msrp_incl_tax",
        fieldValue: String(p.msrp_incl_tax),
        message: "価格が負の数になっています",
        suggestion: "0 以上の整数で入力してください",
        handle: p.handle,
      });
    }

    if (
      (p.msrp_incl_tax === 0 || p.msrp_incl_tax == null) &&
      p.status === "active"
    ) {
      issues.push({
        severity: "error",
        code: "PRICE_ZERO_WITH_ACTIVE",
        rowNumber: p.rowNumber,
        fieldName: "公開状態",
        fieldValue: p.status,
        message: "価格が未入力なのに「公開」になっています",
        suggestion: "定価を入れるか、公開状態を「下書き」にしてください",
        handle: p.handle,
      });
    }

    if (p.status && !VALID_STATUSES.includes(p.status)) {
      issues.push({
        severity: "error",
        code: "INVALID_STATUS",
        rowNumber: p.rowNumber,
        fieldName: "公開状態",
        fieldValue: p.status,
        message: `公開状態 '${p.status}' は使えません`,
        suggestion: "「公開」か「下書き」を入力してください",
        handle: p.handle,
      });
    }

    if (!p.body_html && !p.description_short && !p.description_long) {
      issues.push({
        severity: "warning",
        code: "NO_DESCRIPTION",
        rowNumber: p.rowNumber,
        fieldName: "description",
        fieldValue: null,
        message: "商品説明が空です",
        suggestion: null,
        handle: p.handle,
      });
    }
  }

  handleRows.forEach((rows, handle) => {
    if (rows.length > 1) {
      for (const row of rows) {
        issues.push({
          severity: "error",
          code: "DUPLICATE_HANDLE",
          rowNumber: row,
          fieldName: "品番",
          fieldValue: handle,
          message: `品番が他の行と重複しています（行: ${rows.join(", ")}）`,
          suggestion: "品番は商品ごとに別の値にしてください",
          handle,
        });
      }
    }
  });

  const skuRows = new Map<string, number[]>();
  for (const v of parsed.variants) {
    const arr = skuRows.get(v.variant_sku) ?? [];
    arr.push(v.rowNumber);
    skuRows.set(v.variant_sku, arr);
  }
  skuRows.forEach((rows, sku) => {
    if (rows.length > 1) {
      for (const row of rows) {
        issues.push({
          severity: "error",
          code: "DUPLICATE_SKU",
          rowNumber: row,
          fieldName: "variant_sku",
          fieldValue: sku,
          message: `SKU '${sku}' が複数行に出現 (行: ${rows.join(", ")})`,
          suggestion: "SKU を一意にしてください",
          handle: null,
        });
      }
    }
  });

  return issues;
}
