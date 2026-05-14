import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/adminSession";

/**
 * POST /api/admin/logout
 * Clears the session cookie. Always returns 200 so the client
 * can redirect regardless of whether a session existed.
 */
export async function POST() {
  const res = NextResponse.json({ success: true });

  // Overwrite the cookie with an empty value and maxAge=0 to delete it.
  // Setting httpOnly/secure/sameSite must match the original Set-Cookie
  // attributes — browsers ignore the deletion if they differ.
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return res;
}
