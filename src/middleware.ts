import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { updateSession } from "./lib/supabase/middleware";

const excludedPathsWithNoToken = [
  "/privacy",
  "/eula",
  "/signin",
  "/signup",
  "/",
];
const handleI18nRouting = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // 1. Nếu là các đường dẫn /api (như webhook MongoDB), cho qua luôn
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // 2. Chạy hàm updateSession của Supabase trước để refresh cookie/session
  // Hàm này trả về một response chuẩn đã đính kèm cookie mới của Supabase
  let supabaseResponse = await updateSession(req);

  // Nếu Supabase muốn redirect (ví dụ chưa đăng nhập mà bắt buộc vào trang nào đó)
  if (supabaseResponse.headers.get("x-middleware-redirect")) {
    return supabaseResponse;
  }

  // 3. Kiểm tra NextAuth Token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Tự động tìm và loại bỏ locale ở đầu pathname (Ví dụ: /en/dashboard -> /dashboard)
  const pathnameWithoutLocale = pathname.replace(
    new RegExp(`^/(${routing.locales.join("|")})(/|$)`),
    "/",
  );

  // Kiểm tra đường dẫn nằm trong danh sách ngoại lệ không cần token hay không
  const isExcluded = excludedPathsWithNoToken.some((p) => {
    return pathnameWithoutLocale === p || pathname === p;
  });

  const locale =
    routing.locales.find((l) => pathname.startsWith(`/${l}`)) ||
    routing.defaultLocale;

  // Nếu chưa có NextAuth token và không nằm trong trang ngoại lệ -> Chuyển hướng về login
  if (!token && !isExcluded) {
    const signInUrl = new URL(`/${locale}/signin`, req.url);
    const callbackUrl = `${pathnameWithoutLocale}${req.nextUrl.search}`;
    signInUrl.searchParams.set("callbackUrl", callbackUrl);

    return NextResponse.redirect(signInUrl);
  }

  // 4. Chạy next-intl routing, đồng thời phải kết hợp giữ lại các cookie/header mà Supabase đã cập nhật
  const intlResponse = handleI18nRouting(req);

  // Chép các cookie mới của Supabase sang response của next-intl để không bị lệch session
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, cookie);
  });

  return intlResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
