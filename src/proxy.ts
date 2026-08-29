import { NextResponse, type NextRequest } from "next/server";

// /admin/* の保護。admin_id Cookie が無ければログインへ。
// (Cookie の正当性は各レイアウトの requireAdmin() が最終確認する)
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const hasSession = request.cookies.has("admin_id");

  // Cookie が無ければログインへ。Cookie の正当性チェックと
  // 「ログイン済みならダッシュボードへ」は /admin/login のページ側で行う
  // (proxy で往復させると stale cookie で無限リダイレクトになるため)。
  if (path.startsWith("/admin") && path !== "/admin/login" && !hasSession) {
    const to = request.nextUrl.clone();
    to.pathname = "/admin/login";
    return NextResponse.redirect(to);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
