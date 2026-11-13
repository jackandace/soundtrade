import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const path = request.nextUrl.pathname;
  const isAdminPath = path.startsWith("/admin");
  const isLoginPath = path === "/admin/login";
  // 未ログインでも開ける認証系ページ（パスワード再設定の申請・メールリンクの受け口）。
  // /admin/reset-password 本体はメールリンクで張られたセッションが必要なので含めない。
  const isPublicAuthPath =
    path === "/admin/forgot-password" || path === "/admin/reset-password/confirm";

  if (isAdminPath && !isLoginPath && !isPublicAuthPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (isLoginPath && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
