import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE_NAME } from "@/lib/adminSession";

/**
 * GET /api/admin/me
 * Verifies the session JWT and returns the current admin's display info.
 * Runs in Node.js runtime — jose JWT verification works reliably here.
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value ?? "";
  const session = await verifySession(token);

  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  return NextResponse.json({
    name:     session.name,
    role:     session.role,
    username: session.username,
  });
}
