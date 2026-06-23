import { createAdminClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/admin/TopBar";
import { parseTags } from "@/lib/tags";
import { TagManager } from "./TagManager";

export const dynamic = "force-dynamic";

export default async function TagsAdminPage() {
  const supabase = createAdminClient();

  const [{ data: masterRows }, { data: productRows }] = await Promise.all([
    supabase
      .from("tag_master")
      .select("id, name")
      .order("name", { ascending: true }),
    supabase.from("products").select("tags"),
  ]);

  // 商品で使われているタグの使用数を集計
  const usage = new Map<string, number>();
  for (const p of productRows ?? []) {
    for (const t of parseTags(p.tags)) {
      usage.set(t, (usage.get(t) ?? 0) + 1);
    }
  }

  const registered = (masterRows ?? []).map((m) => ({
    name: m.name as string,
    count: usage.get(m.name as string) ?? 0,
  }));

  const registeredNames = new Set(registered.map((r) => r.name));
  // 商品で使われているのに未登録のタグ
  const unregistered = Array.from(usage.entries())
    .filter(([name]) => !registeredNames.has(name))
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return (
    <>
      <TopBar title="タグ管理" />
      <div className="flex flex-col gap-5 p-8">
        <p className="text-admin-sm text-admin-inkSub">
          タグを語彙として登録・整理します。商品へのタグ付けは「商品マスタ」で一括設定できます。
        </p>
        <TagManager registered={registered} unregistered={unregistered} />
      </div>
    </>
  );
}
