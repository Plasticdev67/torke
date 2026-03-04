import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect WMS routes
  if (pathname.startsWith("/goods-in") || pathname.startsWith("/stock")) {
    // Check for Better Auth session cookie
    const sessionCookie =
      request.cookies.get("better-auth.session_token") ??
      request.cookies.get("__Secure-better-auth.session_token");

    if (!sessionCookie?.value) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/goods-in/:path*", "/stock/:path*"],
};
