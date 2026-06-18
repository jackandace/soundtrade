import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/admin/TopBar";
import { Card } from "@/components/admin/Card";
import { ProductBulkTable, type ProductRowData } from "./ProductBulkTable";

export const dynamic = "force-dynamic";

const STATUS_TABS = [
  { id: "all", label: "すべて" },
  { id: "active", label: "公開中" },
  { id: "draft", label: "下書き" },
  { id: "archived", label: "非公開" },
];

type SearchParams = {
  status?: string;
  q?: string;
  category?: string;
  maker?: string;
  tag?: string;
};

export default async function ProductsListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createAdminClient();
  const selectedStatus = searchParams.status ?? "all";
  const q = (searchParams.q ?? "").trim();
  const category = (searchParams.category ?? "").trim();
  const maker = (searchParams.maker ?? "").trim();
  const tag = (searchParams.tag ?? "").trim();

  let query = supabase
    .from("products")
    .select(
      "id, handle, product_name, category_l2, maker, status, tags, updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(200);

  if (selectedStatus !== "all") query = query.eq("status", selectedStatus);
  if (category) query = query.eq("category_l2", category);
  if (maker) query = query.eq("maker", maker);
  if (tag) query = query.ilike("tags", `%${tag}%`);
  if (q) {
    query = query.or(
      `product_name.ilike.%${q}%,handle.ilike.%${q}%,sku_base.ilike.%${q}%`,
    );
  }

  // 絞り込みの選択肢（カテゴリ/メーカー）と登録タグ
  const [{ data: rows, error }, { data: facetRows }, { data: tagRows }] =
    await Promise.all([
      query,
      supabase.from("products").select("category_l2, maker"),
      supabase.from("tag_master").select("name").order("name"),
    ]);

  const categorySet = new Set<string>();
  const makerSet = new Set<string>();
  for (const r of facetRows ?? []) {
    if (r.category_l2) categorySet.add(r.category_l2);
    if (r.maker) makerSet.add(r.maker);
  }
  const categories = Array.from(categorySet).sort();
  const makers = Array.from(makerSet).sort();
  const registeredTags = (tagRows ?? []).map((t) => t.name as string);

  return (
    <>
      <TopBar title="商品マスタ" />
      <div className="flex flex-col gap-5 p-8">
        {/* ステータスタブ */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1 rounded-md border border-admin-line bg-admin-surface p-1">
            {STATUS_TABS.map((t) => {
              const active = selectedStatus === t.id;
              const sp = new URLSearchParams();
              if (t.id !== "all") sp.set("status", t.id);
              if (q) sp.set("q", q);
              if (category) sp.set("category", category);
              if (maker) sp.set("maker", maker);
              if (tag) sp.set("tag", tag);
              const s = sp.toString();
              return (
                <Link
                  key={t.id}
                  href={s ? `/admin/products?${s}` : "/admin/products"}
                  className={`flex min-h-10 items-center rounded px-4 text-admin-sm font-medium ${
                    active
                      ? "bg-admin-navy text-white"
                      : "text-admin-inkSub hover:bg-admin-surfaceAlt"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
          <Link
            href="/admin/tags"
            className="flex min-h-10 items-center rounded-md border border-admin-line bg-admin-surface px-4 text-admin-sm font-medium text-admin-ink hover:bg-admin-surfaceAlt"
          >
            タグ管理 →
          </Link>
        </div>

        {/* 詳細検索（カテゴリ / メーカー / タグ / キーワード） */}
        <form
          action="/admin/products"
          className="flex flex-wrap items-end gap-3 rounded-md border border-admin-line bg-admin-surface p-3"
        >
          {selectedStatus !== "all" && (
            <input type="hidden" name="status" value={selectedStatus} />
          )}
          <Facet label="カテゴリ" name="category" value={category} options={categories} />
          <Facet label="メーカー" name="maker" value={maker} options={makers} />
          <div>
            <label className="mb-1 block text-admin-xs text-admin-inkSub">
              タグ
            </label>
            <input
              type="text"
              name="tag"
              defaultValue={tag}
              placeholder="タグで絞り込み"
              className="block min-h-10 w-40 rounded-md border border-admin-line bg-admin-surface px-3 text-admin-sm outline-none focus:border-admin-navy"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-admin-xs text-admin-inkSub">
              キーワード
            </label>
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="商品名・handle・SKU"
              className="block min-h-10 w-full rounded-md border border-admin-line bg-admin-surface px-3 text-admin-sm outline-none focus:border-admin-navy"
            />
          </div>
          <button
            type="submit"
            className="flex min-h-10 items-center rounded-md bg-admin-navy px-5 text-admin-sm font-bold text-white hover:bg-admin-navyHover"
          >
            絞り込む
          </button>
          {(category || maker || tag || q) && (
            <Link
              href={
                selectedStatus !== "all"
                  ? `/admin/products?status=${selectedStatus}`
                  : "/admin/products"
              }
              className="text-admin-xs text-admin-inkMute underline-offset-2 hover:underline"
            >
              クリア
            </Link>
          )}
        </form>

        <Card>
          {error ? (
            <p className="py-8 text-center text-admin-sm text-admin-danger">
              取得エラー: {error.message}
            </p>
          ) : (rows?.length ?? 0) === 0 ? (
            <p className="py-12 text-center text-admin-sm text-admin-inkSub">
              該当する商品はありません。
            </p>
          ) : (
            <>
              <p className="mb-3 text-admin-xs text-admin-inkMute">
                {rows?.length ?? 0} 件表示（上限 200 件）。チェックを入れて上のバーで一括タグ付けできます。
              </p>
              <ProductBulkTable
                rows={(rows ?? []) as ProductRowData[]}
                registeredTags={registeredTags}
              />
            </>
          )}
        </Card>
      </div>
    </>
  );
}

function Facet({
  label,
  name,
  value,
  options,
}: {
  label: string;
  name: string;
  value: string;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-1 block text-admin-xs text-admin-inkSub">{label}</label>
      <select
        name={name}
        defaultValue={value}
        className="block min-h-10 w-40 rounded-md border border-admin-line bg-admin-surface px-3 text-admin-sm outline-none focus:border-admin-navy"
      >
        <option value="">すべて</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
