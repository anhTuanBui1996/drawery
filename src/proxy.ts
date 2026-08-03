import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getLocaleFromPathname } from "./lib/utils";

const excludedPathsWithNoToken = ["/signin", "/signup", "/"];
const handleI18nRouting = createMiddleware(routing);

export default async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const locale = getLocaleFromPathname(req.nextUrl.pathname);

  if (
    !token &&
    !excludedPathsWithNoToken.filter((p) => req.nextUrl.pathname.endsWith(p))
      .length &&
    req.nextUrl.pathname !== `/${locale}`
  ) {
    const signInUrl = new URL(`/${locale}/signin`, req.url);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return handleI18nRouting(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
