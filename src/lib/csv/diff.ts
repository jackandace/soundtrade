import type { SupabaseClient } from "@supabase/supabase-js";

export type DiffStatus = "new" | "update" | "unchanged" | "invalid";

export type DiffChange = {
  field: string;
  label: string;
  before: string | null;
  after: string | null;
};

export type DiffEntry = {
  stagingId: string;
  status: DiffStatus;
  handle: string;
  productName: string | null;
  changes: DiffChange[];
};

export type DiffResult = {
  entries: DiffEntry[];
  counts: { new: number; update: number; unchanged: number; invalid: number };
};

const COMPARE_FIELDS: Array<{ key: string; label: string }> = [
  { key: "product_name", label: "商品名" },
  { key: "maker", label: "メーカー" },
  { key: "status", label: "ステータス" },
  { key: "msrp", label: "希望小売 (税抜)" },
  { key: "category_l1", label: "カテゴリ L1" },
  { key: "category_l2", label: "カテゴリ L2" },
  { key: "category_l3", label: "カテゴリ L3" },
];

function normalize(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

export async function computeDiff(
  supabase: SupabaseClient,
  jobId: string,
): Promise<DiffResult> {
  const { data: stagingRows } = await supabase
    .from("products_staging")
    .select(
      "id, handle, product_name, maker, category_l1, category_l2, category_l3, msrp, msrp_incl_tax, status",
    )
    .eq("import_job_id", jobId);

  const { data: errorRefs } = await supabase
    .from("import_errors")
    .select("staging_product_id")
    .eq("import_job_id", jobId)
    .eq("severity", "error");

  const invalidStagingIds = new Set<string>();
  for (const e of errorRefs ?? []) {
    if (e.staging_product_id) invalidStagingIds.add(e.staging_product_id);
  }

  const handles = (stagingRows ?? []).map((s) => s.handle);
  const { data: prodRows } =
    handles.length > 0
      ? await supabase
          .from("products")
          .select(
            "handle, product_name, maker, category_l1, category_l2, category_l3, msrp, status",
          )
          .in("handle", handles)
      : { data: [] };

  const prodMap = new Map<string, Record<string, unknown>>();
  for (const p of (prodRows ?? []) as Record<string, unknown>[]) {
    if (typeof p.handle === "string") prodMap.set(p.handle, p);
  }

  const entries: DiffEntry[] = [];
  const counts = { new: 0, update: 0, unchanged: 0, invalid: 0 };

  for (const s of (stagingRows ?? []) as Record<string, unknown>[]) {
    const handle = String(s.handle);
    const stagingId = String(s.id);
    const productName = typeof s.product_name === "string" ? s.product_name : null;

    if (invalidStagingIds.has(stagingId)) {
      entries.push({ stagingId, status: "invalid", handle, productName, changes: [] });
      counts.invalid++;
      continue;
    }

    const prod = prodMap.get(handle);
    if (!prod) {
      entries.push({ stagingId, status: "new", handle, productName, changes: [] });
      counts.new++;
      continue;
    }

    const changes: DiffChange[] = [];
    for (const { key, label } of COMPARE_FIELDS) {
      const before = normalize(prod[key]);
      const after = normalize(s[key]);
      if (before !== after) {
        changes.push({ field: key, label, before, after });
      }
    }

    if (changes.length > 0) {
      entries.push({ stagingId, status: "update", handle, productName, changes });
      counts.update++;
    } else {
      entries.push({ stagingId, status: "unchanged", handle, productName, changes: [] });
      counts.unchanged++;
    }
  }

  // ソート: invalid → update → new → unchanged
  const order: Record<DiffStatus, number> = { invalid: 0, update: 1, new: 2, unchanged: 3 };
  entries.sort((a, b) => order[a.status] - order[b.status] || a.handle.localeCompare(b.handle));

  return { entries, counts };
}
