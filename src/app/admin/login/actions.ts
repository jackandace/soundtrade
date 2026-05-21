"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";

export type LoginResult =
  | { ok: true }
  | { ok: false; error: string };

export async function loginAction(formData: FormData): Promise<LoginResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, error: "メールアドレスとパスワードを入力してください" };
  }

  const supabase = createClient();
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !authData.user) {
    return {
      ok: false,
      error: "ログインに失敗しました。メールアドレスとパスワードを確認してください",
    };
  }

  // 権限チェックは service_role でバイパスして直接照会。
  // Server Action 内で signInWithPassword 直後にユーザー JWT で別クエリを投げると、
  // 当該リクエスト内の Cookie が未反映で RLS に弾かれるため。
  const admin = createAdminClient();
  const { data: adminRow } = await admin
    .from("admin_users")
    .select("id, is_active")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (!adminRow || adminRow.is_active === false) {
    await supabase.auth.signOut();
    return {
      ok: false,
      error: "このアカウントは管理画面の利用権限がありません",
    };
  }

  return { ok: true };
}

export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
}
