import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/admin-auth";

const STATUS_JP: Record<string, string> = {
  active: "公開",
  draft: "下書き",
  archived: "非公開",
};

// 取込テンプレートと同じ列構成（編集して再アップロードできる）
const HEADERS = [
  "品番",
  "商品名",
  "メーカー",
  "カテゴリ大分類",
  "カテゴリ中分類",
  "カテゴリ小分類",
  "定価(税込)",
  "公開状態",
  "商品説明",
  "タグ",
];

export async function GET(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? "all";
  const category = (url.searchParams.get("category") ?? "").trim();
  const maker = (url.searchParams.get("maker") ?? "").trim();
  const tag = (url.searchParams.get("tag") ?? "").trim();
  const q = (url.searchParams.get("q") ?? "").trim();

  const supabase = createAdminClient();
  let query = supabase
    .from("products")
    .select(
      "sku_base, product_name, maker, category_l1, category_l2, category_l3, msrp_incl_tax, status, description_short, tags",
    )
    .order("maker", { ascending: true })
    .order("category_l2", { ascending: true })
    .order("product_name", { ascending: true })
    .limit(10000);

  if (status !== "all") query = query.eq("status", status);
  if (category) query = query.eq("category_l2", category);
  if (maker) query = query.eq("maker", maker);
  if (tag) query = query.ilike("tags", `%${tag}%`);
  if (q) {
    query = query.or(
      `product_name.ilike.%${q}%,handle.ilike.%${q}%,sku_base.ilike.%${q}%`,
    );
  }

  const { data: rows, error } = await query;
  if (error) return new NextResponse(`Error: ${error.message}`, { status: 500 });

  const wb = new ExcelJS.Workbook();
  wb.creator = "SOUND·TRADE";
  const ws = wb.addWorksheet("商品データ");
  ws.addRow(HEADERS);
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1B2A41" },
    };
  });

  for (const p of rows ?? []) {
    ws.addRow([
      p.sku_base ?? "",
      p.product_name ?? "",
      p.maker ?? "",
      p.category_l1 ?? "",
      p.category_l2 ?? "",
      p.category_l3 ?? "",
      p.msrp_incl_tax ?? "",
      STATUS_JP[p.status] ?? p.status ?? "",
      p.description_short ?? "",
      p.tags ?? "",
    ]);
  }
  ws.columns = HEADERS.map((h, i) => ({
    width: i === 1 || i === 8 ? 30 : Math.max(10, h.length * 2 + 2),
  }));

  const buf = await wb.xlsx.writeBuffer();
  const stamp = url.searchParams.get("ts") ?? "export";
  const filename = `sound-trade_商品データ_${stamp}.xlsx`;
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="products.xlsx"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
