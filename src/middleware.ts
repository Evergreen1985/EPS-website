import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/adminSession";

/**
 * Middleware runs on the Edge runtime.
 * We only check cookie PRESENCE here (Edge can't always verify JWTs reliably).
 * Full JWT verification happens in /api/admin/me (Node.js runtime).
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/admin")) return NextResponse.next();
  if (pathname === "/admin-login") return NextResponse.next();
  if (pathname.startsWith("/api/admin/login")) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value ?? "";

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }
    const loginUrl = new URL("/admin-login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
