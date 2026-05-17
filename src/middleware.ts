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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_EXACT.has(pathname)) return NextResponse.next();

  if (isAdminRoute(pathname)) {
    const token = req.cookies.get(COOKIE_NAME)?.value ?? "";
    const session = token ? await verifySession(token) : null;
    if (!session) {
      if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
      const res = NextResponse.redirect(new URL("/admin-login", req.url));
      if (token) res.cookies.delete(COOKIE_NAME);
      return res;
    }
    return NextResponse.next();
  }

  if (isOwnerRoute(pathname)) {
    const token = req.cookies.get(OWNER_COOKIE_NAME)?.value ?? "";
    const session = token ? await verifyOwnerSession(token) : null;
    if (!session) {
      if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
      const res = NextResponse.redirect(new URL("/owner-login", req.url));
      if (token) res.cookies.delete(OWNER_COOKIE_NAME);
      return res;
    }
    return NextResponse.next();
  }

  if (isTeacherRoute(pathname)) {
    const token = req.cookies.get(TEACHER_COOKIE_NAME)?.value ?? "";
    const session = token ? await verifyTeacherSession(token) : null;
    if (!session) {
      if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
      const res = NextResponse.redirect(new URL("/teacher-login", req.url));
      if (token) res.cookies.delete(TEACHER_COOKIE_NAME);
      return res;
    }
    return NextResponse.next();
  }

  if (isParentRoute(pathname)) {
    const token = req.cookies.get(PARENT_COOKIE_NAME)?.value ?? "";
    const session = token ? await verifyParentSession(token) : null;
    if (!session) {
      if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
      const res = NextResponse.redirect(new URL("/parent-login", req.url));
      if (token) res.cookies.delete(PARENT_COOKIE_NAME);
      return res;
    }
    return NextResponse.next();
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
