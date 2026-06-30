import { getResend, getFromAddress, type SendResult } from "./client";

const SITE_NAME = "楽器卸のミツエス";

export type ImportSummary = {
  jobId: string;
  filename: string;
  uploaderName: string;
  productsAffected: number;
  variantsAffected: number;
  specsAffected: number;
  snapshotId: string;
  jobUrl: string;
};

function escape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendImportSuccess(
  summary: ImportSummary,
  adminEmails: string[],
): Promise<SendResult> {
  if (adminEmails.length === 0) return { ok: false, reason: "not_configured" };
  const resend = getResend();
  if (!resend) return { ok: false, reason: "not_configured" };

  const subject = `[${SITE_NAME} 管理] CSV取込が反映されました（${summary.productsAffected}商品）`;
  const html = `
<div style="font-family:'Noto Sans JP',sans-serif;color:#1A1A1A;line-height:1.7;max-width:600px;">
  <p style="background:#E8F3E9;border:1px solid #2E7D3240;padding:8px 12px;border-radius:4px;color:#1f5a25;">
    ✓ CSV取込の本番反映が完了しました
  </p>
  <table style="border-collapse:collapse;margin:16px 0;font-size:14px;">
    <tr><td style="padding:4px 12px 4px 0;color:#555;">ファイル</td><td style="padding:4px 0;">${escape(summary.filename)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#555;">実行者</td><td style="padding:4px 0;">${escape(summary.uploaderName)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#555;">商品行</td><td style="padding:4px 0;">${summary.productsAffected.toLocaleString("ja-JP")} 件</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#555;">バリアント</td><td style="padding:4px 0;">${summary.variantsAffected.toLocaleString("ja-JP")} 件</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#555;">スペック</td><td style="padding:4px 0;">${summary.specsAffected.toLocaleString("ja-JP")} 件</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#555;">snapshot</td><td style="padding:4px 0;font-family:monospace;font-size:12px;">${escape(summary.snapshotId)}</td></tr>
  </table>
  <p><a href="${escape(summary.jobUrl)}">管理画面でジョブ詳細を開く →</a></p>
  <p style="margin-top:24px;font-size:12px;color:#888;">取消が必要な場合は super_admin がスナップショットからロールバックできます。</p>
</div>`;

  const text = `CSV取込が反映されました

ファイル:   ${summary.filename}
実行者:     ${summary.uploaderName}
商品行:     ${summary.productsAffected.toLocaleString("ja-JP")} 件
バリアント: ${summary.variantsAffected.toLocaleString("ja-JP")} 件
スペック:   ${summary.specsAffected.toLocaleString("ja-JP")} 件
snapshot:   ${summary.snapshotId}

管理画面: ${summary.jobUrl}`;

  try {
    const r = await resend.emails.send({
      from: getFromAddress(),
      to: adminEmails,
      subject,
      html,
      text,
    });
    if (r.error) return { ok: false, reason: "send_failed", error: r.error.message };
    return { ok: true, id: r.data?.id ?? "" };
  } catch (e) {
    return { ok: false, reason: "send_failed", error: (e as Error).message };
  }
}
