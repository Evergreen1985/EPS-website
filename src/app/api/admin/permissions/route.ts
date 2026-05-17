import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE_NAME } from "@/lib/adminSession";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value ?? "";
  const session = await verifySession(token);
  if (!session) return NextResponse.json({ permissions: null });

  // Full admins (admin_accounts) have no permissions array in JWT → null = all tabs
  // Restricted staff (teacher_accounts with admin access) have explicit permissions embedded
  return NextResponse.json({ permissions: session.permissions ?? null });
}
