import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TestPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("product_name, handle")
    .limit(5);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 font-sans">
      <h1 className="text-2xl font-medium mb-6">Supabase 接続テスト</h1>

      {error ? (
        <div className="border border-red-300 bg-red-50 p-4 rounded">
          <p className="font-medium text-red-700">⚠ エラー</p>
          <pre className="mt-2 text-sm whitespace-pre-wrap">{error.message}</pre>
          <p className="mt-2 text-sm text-red-700">
            考えられる原因: マイグレーション未実行 / RLS ポリシー / 環境変数の値
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-4">
            取得件数: {data?.length ?? 0} 件（status=&apos;active&apos; のみ）
          </p>
          {data && data.length > 0 ? (
            <ul className="divide-y border-y">
              {data.map((p) => (
                <li key={p.handle} className="py-3 flex justify-between gap-4">
                  <span className="font-medium">{p.product_name}</span>
                  <span className="text-sm text-gray-500 font-mono">
                    {p.handle}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">
              該当する商品がありません（active な商品が 0 件）。
            </p>
          )}
        </>
      )}
    </main>
  );
}
