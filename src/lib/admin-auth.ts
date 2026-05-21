import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export type AdminUser = {
  id: string;
  email: string;
  display_name: string;
  role: "super_admin" | "admin" | "editor" | "client";
};

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  // 現在のユーザー特定だけ JWT 経由（cookies からセッションを読む）。
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // 権限ロウの参照は service_role で。
  // Server Action 内などで Cookie 反映待ちの場合に RLS で空が返るのを避ける。
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("admin_users")
    .select("id, email, display_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data || data.is_active === false) return null;
  return {
    id: data.id,
    email: data.email,
    display_name: data.display_name,
    role: data.role,
  };
}

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin/login");
  }
  return admin;
}
