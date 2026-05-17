import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifySession } from "@/lib/adminSession";

// Routes protected by admin JWT — non-admin callers get 401/redirect
const ADMIN_PREFIXES = [
  "/admin",
  "/api/admin",
  "/api/import",
  "/api/staff",
  "/api/academic-years",
  "/api/settings",
];

// Exact paths that must always be reachable without a session
const PUBLIC_EXACT = new Set(["/admin-login", "/api/admin/login"]);

function isAdminRoute(pathname: string) {
  return ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p + "?"));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!isAdminRoute(pathname)) return NextResponse.next();
  if (PUBLIC_EXACT.has(pathname))  return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value ?? "";

  // Full JWT verification — not just presence check
  const session = token ? await verifySession(token) : null;

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }
    const res = NextResponse.redirect(new URL("/admin-login", req.url));
    if (token) res.cookies.delete(COOKIE_NAME); // clear stale/invalid cookie
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/import/:path*",
    "/api/staff",
    "/api/staff/:path*",
    "/api/academic-years",
    "/api/academic-years/:path*",
    "/api/settings",
    "/api/settings/:path*",
  ],
};
