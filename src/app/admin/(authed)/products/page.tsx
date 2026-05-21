import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/admin/TopBar";
import { Card } from "@/components/admin/Card";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const dynamic = "force-dynamic";

type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral";

const PRODUCT_STATUS: Record<string, { label: string; variant: StatusVariant }> = {
  active: { label: "公開中", variant: "success" },
  draft: { label: "下書き", variant: "neutral" },
  archived: { label: "非公開", variant: "danger" },
};

const STATUS_TABS = [
  { id: "all", label: "すべて" },
  { id: "active", label: "公開中" },
  { id: "draft", label: "下書き" },
  { id: "archived", label: "非公開" },
];

export default async function ProductsListPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const supabase = createAdminClient();
  const selectedStatus = searchParams.status ?? "all";
  const q = (searchParams.q ?? "").trim();

  let query = supabase
    .from("products")
    .select("id, handle, product_name, category_l1, maker, status, updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (selectedStatus !== "all" && PRODUCT_STATUS[selectedStatus]) {
    query = query.eq("status", selectedStatus);
  }
  if (q) {
    query = query.or(`product_name.ilike.%${q}%,handle.ilike.%${q}%,sku_base.ilike.%${q}%`);
  }

  const { data: rows, error } = await query;

  return (
    <>
      <TopBar title="商品マスタ" />
      <div className="flex flex-col gap-5 p-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1 rounded-md border border-admin-line bg-admin-surface p-1">
            {STATUS_TABS.map((t) => {
              const active = selectedStatus === t.id;
              const href = (() => {
                const sp = new URLSearchParams();
                if (t.id !== "all") sp.set("status", t.id);
                if (q) sp.set("q", q);
                const s = sp.toString();
                return s ? `/admin/products?${s}` : "/admin/products";
              })();
              return (
                <Link
                  key={t.id}
                  href={href}
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
          <form className="flex flex-1 items-center gap-2" action="/admin/products">
            {selectedStatus !== "all" && (
              <input type="hidden" name="status" value={selectedStatus} />
            )}
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="商品名・handle・SKU で検索"
              className="block min-h-10 flex-1 rounded-md border border-admin-line bg-admin-surface px-3 text-admin-sm outline-none focus:border-admin-navy"
            />
            <button
              type="submit"
              className="flex min-h-10 items-center rounded-md border border-admin-line bg-admin-surface px-4 text-admin-sm font-medium text-admin-ink hover:bg-admin-surfaceAlt"
            >
              検索
            </button>
          </form>
        </div>

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
                上位 100 件まで表示しています
              </p>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-admin-lineLight text-left text-admin-xs text-admin-inkMute">
                    <th className="py-3 font-medium">商品名</th>
                    <th className="py-3 font-medium">handle</th>
                    <th className="py-3 font-medium">カテゴリ</th>
                    <th className="py-3 font-medium">メーカー</th>
                    <th className="py-3 font-medium">ステータス</th>
                    <th className="py-3 font-medium">最終更新</th>
                  </tr>
                </thead>
                <tbody>
                  {(rows ?? []).map((r) => {
                    const st = PRODUCT_STATUS[r.status] ?? PRODUCT_STATUS.draft;
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-admin-lineLight last:border-0 hover:bg-admin-surfaceAlt"
                      >
                        <td className="py-3 text-admin-sm">
                          <Link
                            href={`/admin/products/${r.id}`}
                            className="text-admin-ink underline-offset-2 hover:underline"
                          >
                            {r.product_name}
                          </Link>
                        </td>
                        <td className="py-3 font-dm text-admin-xs text-admin-inkMute">
                          {r.handle}
                        </td>
                        <td className="py-3 text-admin-sm text-admin-inkSub">
                          {r.category_l1 ?? "—"}
                        </td>
                        <td className="py-3 text-admin-sm text-admin-inkSub">
                          {r.maker ?? "—"}
                        </td>
                        <td className="py-3">
                          <StatusBadge variant={st.variant}>{st.label}</StatusBadge>
                        </td>
                        <td className="py-3 text-admin-xs text-admin-inkMute">
                          {new Date(r.updated_at).toLocaleString("ja-JP")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
