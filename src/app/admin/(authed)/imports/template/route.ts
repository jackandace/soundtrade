import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getCurrentAdmin } from "@/lib/admin-auth";

// 記入用の列定義（順序つき）
const COLUMNS: Array<{
  header: string;
  required: boolean;
  desc: string;
  example: string;
}> = [
  { header: "品番", required: true, desc: "商品の型番。重複しない値。", example: "YCL-255" },
  { header: "商品名", required: true, desc: "サイトに表示される商品名。", example: "YAMAHA YCL-255" },
  { header: "メーカー", required: true, desc: "ブランド/メーカー名。", example: "YAMAHA" },
  { header: "カテゴリ大分類", required: false, desc: "例: 管楽器", example: "管楽器" },
  { header: "カテゴリ中分類", required: false, desc: "絞り込みに使う種別。例: クラリネット", example: "クラリネット" },
  { header: "カテゴリ小分類", required: false, desc: "さらに細かい分類。", example: "B♭クラリネット" },
  { header: "定価(税込)", required: false, desc: "メーカー希望小売価格（税込）。数字のみ。空でも可。", example: "105000" },
  { header: "公開状態", required: false, desc: "「公開」か「下書き」。空なら価格があれば公開。", example: "公開" },
  { header: "商品説明", required: false, desc: "商品の説明文。", example: "スタンダードモデルのB♭クラリネット。" },
  { header: "タグ", required: false, desc: "カンマ区切り。例: 初心者, 入門", example: "初心者, 入門" },
];

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });

  const wb = new ExcelJS.Workbook();
  wb.creator = "楽器卸のミツエス";

  // シート1: 商品データ（記入用）
  const ws = wb.addWorksheet("商品データ");
  ws.addRow(COLUMNS.map((c) => c.header));
  // ヘッダー行の装飾
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1B2A41" },
    };
    cell.alignment = { vertical: "middle" };
  });
  // 記入例 2行
  ws.addRow(COLUMNS.map((c) => c.example));
  ws.addRow([
    "YCL-450",
    "YAMAHA YCL-450",
    "YAMAHA",
    "管楽器",
    "クラリネット",
    "B♭クラリネット",
    "187000",
    "公開",
    "上位モデル。",
    "中級者",
  ]);
  // 列幅
  ws.columns = COLUMNS.map((c) => ({
    width: Math.max(12, c.header.length * 2 + 4),
  }));

  // シート2: 記入ガイド
  const guide = wb.addWorksheet("記入ガイド");
  guide.addRow(["列名", "必須", "説明", "記入例"]);
  const ghr = guide.getRow(1);
  ghr.font = { bold: true };
  for (const c of COLUMNS) {
    guide.addRow([c.header, c.required ? "必須" : "任意", c.desc, c.example]);
  }
  guide.getColumn(1).width = 16;
  guide.getColumn(2).width = 8;
  guide.getColumn(3).width = 50;
  guide.getColumn(4).width = 24;
  guide.addRow([]);
  guide.addRow(["", "", "※「記入例」の2行は削除してから、ご自身のデータを入力してください。", ""]);
  guide.addRow(["", "", "※このファイル(.xlsx)のまま、取込画面にアップロードできます（CSV変換不要）。", ""]);

  const buf = await wb.xlsx.writeBuffer();
  const filename = "sound-trade_商品テンプレート.xlsx";
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="template.xlsx"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
