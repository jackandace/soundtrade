import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/admin-auth";

type ResultRow = {
  sku?: string;
  imageUrl?: string;
  status?: string;
  detail?: string;
};

const STATUS_LABEL: Record<string, string> = {
  ok: "登録",
  unlinked: "型番なし登録",
  skipped: "スキップ",
  download_failed: "取得失敗",
  store_failed: "保存失敗",
};

function csvCell(v: string): string {
  const s = v ?? "";
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(
  _req: Request,
  { params }: { params: { jobId: string } },
) {
  // 認証ガード（管理者のみ）
  const admin = await getCurrentAdmin();
  if (!admin) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: job } = await supabase
    .from("image_import_jobs")
    .select("filename, results, created_at")
    .eq("id", params.jobId)
    .maybeSingle();

  if (!job) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const rows = (job.results ?? []) as ResultRow[];
  const header = ["品番", "画像URL", "結果", "詳細"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        csvCell(r.sku ?? ""),
        csvCell(r.imageUrl ?? ""),
        csvCell(STATUS_LABEL[r.status ?? ""] ?? r.status ?? ""),
        csvCell(r.detail ?? ""),
      ].join(","),
    );
  }
  // Excel の文字化け防止に BOM を付与
  const body = "﻿" + lines.join("\r\n");

  // 元ファイル名から拡張子を除いたベース名
  const base = (job.filename ?? "image-import").replace(/\.[^.]+$/, "");
  const dlName = `result_${base}.csv`;
  // ASCII フォールバック名（非ASCIIは _ に）と、RFC 5987 の UTF-8 名を併記
  const asciiName = dlName.replace(/[^\w.-]/g, "_");
  const utf8Name = encodeURIComponent(dlName);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`,
    },
  });
}
