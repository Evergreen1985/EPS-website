import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifySession } from "@/lib/adminSession";
import { OWNER_COOKIE_NAME, verifyOwnerSession } from "@/lib/ownerSession";
import { TEACHER_COOKIE_NAME, verifyTeacherSession } from "@/lib/teacherSession";
import { PARENT_COOKIE_NAME, verifyParentSession } from "@/lib/parentSession";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ownerToken = req.cookies.get(OWNER_COOKIE_NAME)?.value ?? "";
  if (ownerToken) {
    const s = await verifyOwnerSession(ownerToken);
    if (s) return NextResponse.json({ user_type: "owner", user_ref: s.username, default_name: s.name });
  }

  const teacherToken = req.cookies.get(TEACHER_COOKIE_NAME)?.value ?? "";
  if (teacherToken) {
    const s = await verifyTeacherSession(teacherToken);
    if (s) return NextResponse.json({ user_type: "teacher", user_ref: s.username, default_name: s.name });
  }

  const adminToken = req.cookies.get(COOKIE_NAME)?.value ?? "";
  if (adminToken) {
    const s = await verifySession(adminToken);
    if (s) return NextResponse.json({ user_type: "teacher", user_ref: (s as any).username, default_name: (s as any).name });
  }

  const parentToken = req.cookies.get(PARENT_COOKIE_NAME)?.value ?? "";
  if (parentToken) {
    const s = await verifyParentSession(parentToken);
    if (s) return NextResponse.json({ user_type: "parent", user_ref: s.phone, default_name: s.childName, enquiryId: s.enquiryId });
  }

  return NextResponse.json({ user_type: "community", user_ref: null, default_name: null });
}
