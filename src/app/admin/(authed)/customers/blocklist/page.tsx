import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/admin/TopBar";
import { BlocklistManager } from "./BlocklistManager";

export const dynamic = "force-dynamic";

export default async function BlocklistPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("blocked_domains")
    .select("id, domain, reason, created_at")
    .order("created_at", { ascending: false });

  return (
    <>
      <TopBar title="ブロックリスト（ドメイン）" />
      <div className="flex flex-col gap-5 p-8">
        <Link
          href="/admin/customers"
          className="text-admin-xs text-admin-inkMute underline-offset-2 hover:underline"
        >
          ← 顧客一覧へ
        </Link>
        <p className="max-w-2xl text-admin-sm leading-relaxed text-admin-inkSub">
          登録したドメインからの見積依頼は、以後<strong>自動でアーカイブ</strong>され、
          管理者への通知メールも送られません（依頼自体は記録に残ります）。
        </p>
        <BlocklistManager initial={data ?? []} />
      </div>
    </>
  );
}
