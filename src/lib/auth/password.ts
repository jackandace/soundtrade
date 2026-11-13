// パスワード再設定 / 変更で共通のバリデーション。
// クライアント（即時表示）とサーバー（最終判定）の両方から呼ぶ。

export const PASSWORD_MIN_LENGTH = 8;
// bcrypt の入力上限（72 バイト）を超えると末尾が無視されるため上限を設ける
export const PASSWORD_MAX_LENGTH = 72;

export function validateNewPassword(password: string, confirm: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `パスワードは${PASSWORD_MIN_LENGTH}文字以上で入力してください`;
  }
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_LENGTH) {
    return `パスワードが長すぎます（半角${PASSWORD_MAX_LENGTH}文字以内）`;
  }
  if (password !== confirm) {
    return "確認用パスワードが一致しません";
  }
  return null;
}

// Supabase Auth のエラーを利用者向けの日本語に寄せる
export function describeUpdatePasswordError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("different from the old password") || m.includes("same_password")) {
    return "現在と同じパスワードは設定できません。別のパスワードを入力してください";
  }
  if (m.includes("weak") || m.includes("at least")) {
    return "パスワードが簡単すぎます。英字・数字を組み合わせた長めのパスワードにしてください";
  }
  if (m.includes("reauthentication")) {
    return "セキュリティ確認が必要です。一度ログアウトし、パスワード再設定メールから設定し直してください";
  }
  return "パスワードを更新できませんでした。時間をおいて再度お試しください";
}
