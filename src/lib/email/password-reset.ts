import { getResend, getFromAddress, type SendResult } from "./client";

const SITE_NAME = "楽器卸のミツエス";

function escape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendPasswordResetEmail(params: {
  to: string;
  displayName: string;
  resetUrl: string;
}): Promise<SendResult> {
  const resend = getResend();
  if (!resend) return { ok: false, reason: "not_configured" };

  const { to, displayName, resetUrl } = params;
  const subject = `[${SITE_NAME} 管理] パスワード再設定のご案内`;

  const html = `
<div style="font-family:'Noto Sans JP',sans-serif;color:#1A1A1A;line-height:1.8;max-width:600px;">
  <p>${escape(displayName)} 様</p>
  <p>${SITE_NAME} 管理画面のパスワード再設定のお申し込みを受け付けました。<br>
  下のボタンから新しいパスワードを設定してください。</p>
  <p style="margin:28px 0;">
    <a href="${escape(resetUrl)}" style="display:inline-block;background:#1B2A41;color:#FFFFFF;text-decoration:none;font-weight:bold;padding:14px 28px;border-radius:6px;">
      パスワードを再設定する
    </a>
  </p>
  <p style="font-size:13px;color:#555;">ボタンが押せない場合は、次の URL をブラウザに貼り付けてください。<br>
  <span style="word-break:break-all;">${escape(resetUrl)}</span></p>
  <p style="font-size:13px;color:#555;">
    ・このリンクの有効期限は 1 時間で、1 回のみ使用できます。<br>
    ・お心当たりがない場合は、このメールを破棄してください。パスワードは変更されません。
  </p>
  <p style="margin-top:24px;font-size:12px;color:#888;">このメールは送信専用です。</p>
</div>`;

  const text = `${displayName} 様

${SITE_NAME} 管理画面のパスワード再設定のお申し込みを受け付けました。
次の URL から新しいパスワードを設定してください。

${resetUrl}

・このリンクの有効期限は 1 時間で、1 回のみ使用できます。
・お心当たりがない場合は、このメールを破棄してください。パスワードは変更されません。

このメールは送信専用です。`;

  try {
    const r = await resend.emails.send({
      from: getFromAddress(),
      to: [to],
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
