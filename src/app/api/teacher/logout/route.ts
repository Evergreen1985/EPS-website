import { NextResponse } from "next/server";
import { TEACHER_COOKIE_NAME } from "@/lib/teacherSession";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(TEACHER_COOKIE_NAME);
  return res;
}
