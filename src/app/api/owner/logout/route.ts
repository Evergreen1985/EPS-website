import { NextResponse } from "next/server";
import { OWNER_COOKIE_NAME } from "@/lib/ownerSession";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(OWNER_COOKIE_NAME);
  return res;
}
