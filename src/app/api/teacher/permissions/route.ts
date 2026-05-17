import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { verifyTeacherSession } from "@/lib/teacherSession";

export const dynamic = "force-dynamic";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

export async function GET() {
  try {
    const token = (await cookies()).get("ep_teacher_sid")?.value;
    const session = token ? await verifyTeacherSession(token) : null;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data } = await sb()
      .from("staff_roles")
      .select("permissions")
      .eq("name", session.role)
      .maybeSingle();

    // null = role not in staff_roles (unrestricted — show all tabs)
    // []   = role found but no permissions configured (show nothing)
    // [...] = role found with specific permissions
    const permissions = data ? (data.permissions ?? []) : null;
    return NextResponse.json({ permissions, role: session.role });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
