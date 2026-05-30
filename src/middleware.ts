import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifySession } from "@/lib/adminSession";
import { OWNER_COOKIE_NAME, verifyOwnerSession } from "@/lib/ownerSession";
import { TEACHER_COOKIE_NAME, verifyTeacherSession } from "@/lib/teacherSession";
import { PARENT_COOKIE_NAME, verifyParentSession } from "@/lib/parentSession";

const ADMIN_PREFIXES = [
  "/admin",
  "/api/admin",
  "/api/import",
  "/api/staff",
  "/api/academic-years",
  "/api/settings",
  "/api/programmes",
];

const OWNER_PREFIXES   = ["/owner", "/api/owner"];
const TEACHER_PREFIXES = ["/teacher-dashboard", "/api/teacher"];
const PARENT_PREFIXES  = ["/parent-dashboard", "/api/parent"];

const PUBLIC_EXACT = new Set([
  "/admin-login",
  "/api/admin/login",
  "/owner-login",
  "/api/owner/login",
  "/api/teacher/login",
  "/api/teacher/logout",
  "/api/auth/parent-login",
  "/api/auth/parent-logout",
  "/parent-login",
  "/teacher-login",
]);

function isAdminRoute(p: string) {
  return ADMIN_PREFIXES.some((x) => p === x || p.startsWith(x + "/") || p.startsWith(x + "?"));
}

function isOwnerRoute(p: string) {
  return OWNER_PREFIXES.some((x) => p === x || p.startsWith(x + "/") || p.startsWith(x + "?"));
}

function isTeacherRoute(p: string) {
  return TEACHER_PREFIXES.some((x) => p === x || p.startsWith(x + "/") || p.startsWith(x + "?"));
}

function isParentRoute(p: string) {
  return PARENT_PREFIXES.some((x) => p === x || p.startsWith(x + "/") || p.startsWith(x + "?"));
}

// Map hostnames → school slugs (add new schools here)
const HOSTNAME_SLUG: Record<string, string> = {
  "evergreenprepschools.com":     "evergreen",
  "www.evergreenprepschools.com": "evergreen",
  "evergreenprepschools.in":      "evergreen",
  "www.evergreenprepschools.in":  "evergreen",
  "edu.intelliverify.in":         "intelliverify",
};

function slugFromHost(host: string): string {
  return HOSTNAME_SLUG[host] || process.env.NEXT_PUBLIC_SCHOOL_SLUG || "evergreen";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Inject school slug header for all requests
  const host = req.headers.get("host") || "";
  const slug = slugFromHost(host);
  const res = NextResponse.next();
  res.headers.set("x-school-slug", slug);

  if (PUBLIC_EXACT.has(pathname)) return res;

  if (isAdminRoute(pathname)) {
    const token = req.cookies.get(COOKIE_NAME)?.value ?? "";
    const session = token ? await verifySession(token) : null;
    if (!session) {
      if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
      const r = NextResponse.redirect(new URL("/admin-login", req.url));
      if (token) r.cookies.delete(COOKIE_NAME);
      return r;
    }
    return res;
  }

  if (isOwnerRoute(pathname)) {
    const token = req.cookies.get(OWNER_COOKIE_NAME)?.value ?? "";
    const session = token ? await verifyOwnerSession(token) : null;
    if (!session) {
      if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
      const r = NextResponse.redirect(new URL("/owner-login", req.url));
      if (token) r.cookies.delete(OWNER_COOKIE_NAME);
      return r;
    }
    return res;
  }

  if (isTeacherRoute(pathname)) {
    const token = req.cookies.get(TEACHER_COOKIE_NAME)?.value ?? "";
    const session = token ? await verifyTeacherSession(token) : null;
    if (!session) {
      if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
      const r = NextResponse.redirect(new URL("/teacher-login", req.url));
      if (token) r.cookies.delete(TEACHER_COOKIE_NAME);
      return r;
    }
    return res;
  }

  if (isParentRoute(pathname)) {
    const token = req.cookies.get(PARENT_COOKIE_NAME)?.value ?? "";
    const session = token ? await verifyParentSession(token) : null;
    if (!session) {
      if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
      const r = NextResponse.redirect(new URL("/parent-login", req.url));
      if (token) r.cookies.delete(PARENT_COOKIE_NAME);
      return r;
    }
    return res;
  }

  return res;
}

export const config = {
  matcher: [
    "/api/config",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/import/:path*",
    "/api/staff",
    "/api/staff/:path*",
    "/api/academic-years",
    "/api/academic-years/:path*",
    "/api/settings",
    "/api/settings/:path*",
    "/api/programmes",
    "/api/programmes/:path*",
    "/owner/:path*",
    "/api/owner/:path*",
    "/teacher-dashboard/:path*",
    "/api/teacher/:path*",
    "/parent-dashboard/:path*",
    "/api/parent/:path*",
  ],
};
