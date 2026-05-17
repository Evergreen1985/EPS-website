import { NextResponse } from "next/server";
import { PARENT_COOKIE_NAME } from "@/lib/parentSession";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(PARENT_COOKIE_NAME);
  return res;
}
