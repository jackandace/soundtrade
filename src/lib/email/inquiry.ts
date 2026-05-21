import { getResend, getFromAddress, type SendResult } from "./client";

const SITE_NAME = "SOUND·TRADE";

export type InquirySummary = {
  inquiryNumber: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  desiredDelivery: string;
  message: string;
  items: Array<{ productName: string; handle: string; quantity: number }>;
};

function escape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function itemListHtml(items: InquirySummary["items"]): string {
  return items
    .map(
      (it) =>
        `<li style="margin:6px 0;"><strong>${escape(it.productName)}</strong> ×${it.quantity}<br><span style="color:#888;font-size:12px;">${escape(it.handle)}</span></li>`,
    )
    .join("");
}

function itemListText(items: InquirySummary["items"]): string {
  return items
    .map((it) => `- ${it.productName} ×${it.quantity}  (${it.handle})`)
    .join("\n");
}

export async function sendInquiryConfirmation(
  summary: InquirySummary,
): Promise<SendResult> {
  const resend = getResend();
  if (!resend) return { ok: false, reason: "not_configured" };

  const subject = `[${SITE_NAME}] 見積依頼を受け付けました（${summary.inquiryNumber}）`;
  const html = `
<div style="font-family:'Noto Sans JP',sans-serif;color:#1A1A1A;line-height:1.7;max-width:560px;">
  <p>${escape(summary.contactName)} 様</p>
  <p>${SITE_NAME} をご利用いただきありがとうございます。<br>下記内容で見積依頼を受け付けました。担当者より2営業日以内に見積書をお送りいたします。</p>
  <table style="border-collapse:collapse;margin:16px 0;">
    <tr><td style="padding:4px 12px 4px 0;color:#555;">受付番号</td><td style="padding:4px 0;font-weight:500;">${escape(summary.inquiryNumber)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#555;">会社名</td><td style="padding:4px 0;">${escape(summary.companyName)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#555;">希望納期</td><td style="padding:4px 0;">${escape(summary.desiredDelivery)}</td></tr>
  </table>
  <h3 style="font-size:14px;font-weight:500;border-bottom:1px solid #E5E5E5;padding-bottom:4px;">依頼内容（${summary.items.length}商品）</h3>
  <ul style="padding-left:18px;">${itemListHtml(summary.items)}</ul>
  ${summary.message ? `<h3 style="font-size:14px;font-weight:500;border-bottom:1px solid #E5E5E5;padding-bottom:4px;margin-top:20px;">ご要望・備考</h3><p style="white-space:pre-wrap;">${escape(summary.message)}</p>` : ""}
  <p style="margin-top:24px;font-size:12px;color:#888;">本メールは送信専用です。ご質問は本メールへの返信でお寄せください。</p>
  <p style="font-size:12px;color:#888;">${SITE_NAME} / 合同会社369</p>
</div>`;

  const text = `${summary.contactName} 様

${SITE_NAME} をご利用いただきありがとうございます。
下記内容で見積依頼を受け付けました。担当者より2営業日以内に見積書をお送りいたします。

受付番号: ${summary.inquiryNumber}
会社名:   ${summary.companyName}
希望納期: ${summary.desiredDelivery}

依頼内容（${summary.items.length}商品）:
${itemListText(summary.items)}
${summary.message ? `\nご要望・備考:\n${summary.message}\n` : ""}
--
${SITE_NAME} / 合同会社369`;

  try {
    const r = await resend.emails.send({
      from: getFromAddress(),
      to: summary.email,
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

export async function sendInquiryNotification(
  summary: InquirySummary,
  adminEmails: string[],
): Promise<SendResult> {
  if (adminEmails.length === 0) return { ok: false, reason: "not_configured" };
  const resend = getResend();
  if (!resend) return { ok: false, reason: "not_configured" };

  const subject = `[${SITE_NAME} 管理] 新規見積依頼 ${summary.inquiryNumber} / ${summary.companyName}`;
  const html = `
<div style="font-family:'Noto Sans JP',sans-serif;color:#1A1A1A;line-height:1.7;max-width:600px;">
  <p style="background:#FCF2DC;border:1px solid #F4A30040;padding:8px 12px;border-radius:4px;color:#7a4f00;">
    新規見積依頼が届きました。管理画面で確認・対応してください。
  </p>
  <table style="border-collapse:collapse;margin:16px 0;font-size:14px;">
    <tr><td style="padding:4px 12px 4px 0;color:#555;">受付番号</td><td style="padding:4px 0;font-weight:500;">${escape(summary.inquiryNumber)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#555;">会社名</td><td style="padding:4px 0;">${escape(summary.companyName)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#555;">担当者</td><td style="padding:4px 0;">${escape(summary.contactName)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#555;">メール</td><td style="padding:4px 0;"><a href="mailto:${escape(summary.email)}">${escape(summary.email)}</a></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#555;">電話</td><td style="padding:4px 0;">${escape(summary.phone)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#555;">希望納期</td><td style="padding:4px 0;">${escape(summary.desiredDelivery)}</td></tr>
  </table>
  <h3 style="font-size:14px;font-weight:500;border-bottom:1px solid #E5E5E5;padding-bottom:4px;">依頼内容（${summary.items.length}商品）</h3>
  <ul style="padding-left:18px;">${itemListHtml(summary.items)}</ul>
  ${summary.message ? `<h3 style="font-size:14px;font-weight:500;border-bottom:1px solid #E5E5E5;padding-bottom:4px;margin-top:20px;">ご要望・備考</h3><p style="white-space:pre-wrap;">${escape(summary.message)}</p>` : ""}
</div>`;

  const text = `新規見積依頼

受付番号: ${summary.inquiryNumber}
会社名:   ${summary.companyName}
担当者:   ${summary.contactName}
メール:   ${summary.email}
電話:     ${summary.phone}
希望納期: ${summary.desiredDelivery}

依頼内容（${summary.items.length}商品）:
${itemListText(summary.items)}
${summary.message ? `\nご要望・備考:\n${summary.message}\n` : ""}`;

  try {
    const r = await resend.emails.send({
      from: getFromAddress(),
      to: adminEmails,
      replyTo: summary.email,
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
