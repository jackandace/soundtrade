/**
 * 反映前/後のスナップショット（products 全行を含む JSONB）を比較し、
 * この取込で「新規追加された商品」「更新された商品（フィールド単位の差分）」を抽出する。
 */

type ProductRow = Record<string, unknown>;
type SnapshotData = { products?: ProductRow[] };

export type FieldChange = {
  field: string;
  label: string;
  before: string;
  after: string;
};

export type SnapshotDiff = {
  newProducts: { handle: string; name: string }[];
  updated: { handle: string; name: string; changes: FieldChange[] }[];
  removedCount: number;
};

const COMPARE_FIELDS: Array<{ key: string; label: string }> = [
  { key: "product_name", label: "商品名" },
  { key: "maker", label: "メーカー" },
  { key: "status", label: "ステータス" },
  { key: "msrp", label: "希望小売(税抜)" },
  { key: "msrp_incl_tax", label: "定価(税込)" },
  { key: "category_l1", label: "カテゴリL1" },
  { key: "category_l2", label: "カテゴリL2" },
  { key: "category_l3", label: "カテゴリL3" },
  { key: "tags", label: "タグ" },
  { key: "description_short", label: "説明(短)" },
];

function norm(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function byHandle(products: ProductRow[] | undefined): Map<string, ProductRow> {
  const m = new Map<string, ProductRow>();
  for (const p of products ?? []) {
    const h = typeof p.handle === "string" ? p.handle : null;
    if (h) m.set(h, p);
  }
  return m;
}

export function diffSnapshots(
  before: SnapshotData | null,
  after: SnapshotData | null,
): SnapshotDiff {
  const beforeMap = byHandle(before?.products);
  const afterMap = byHandle(after?.products);

  const newProducts: SnapshotDiff["newProducts"] = [];
  const updated: SnapshotDiff["updated"] = [];

  for (const [handle, aft] of Array.from(afterMap.entries())) {
    const name = norm(aft.product_name) || handle;
    const bef = beforeMap.get(handle);
    if (!bef) {
      newProducts.push({ handle, name });
      continue;
    }
    const changes: FieldChange[] = [];
    for (const { key, label } of COMPARE_FIELDS) {
      const b = norm(bef[key]);
      const a = norm(aft[key]);
      if (b !== a) {
        changes.push({ field: key, label, before: b, after: a });
      }
    }
    if (changes.length > 0) {
      updated.push({ handle, name, changes });
    }
  }

  let removedCount = 0;
  for (const handle of Array.from(beforeMap.keys())) {
    if (!afterMap.has(handle)) removedCount++;
  }

  newProducts.sort((a, b) => a.handle.localeCompare(b.handle));
  updated.sort((a, b) => a.handle.localeCompare(b.handle));

  return { newProducts, updated, removedCount };
}
