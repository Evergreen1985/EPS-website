import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { verifyTeacherSession } from "@/lib/teacherSession";

export const dynamic = "force-dynamic";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

export async function GET() {
  try {
    const token = (await cookies()).get("ep_teacher_sid")?.value;
    const session = token ? await verifyTeacherSession(token) : null;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Look up all sections assigned to this teacher by name
    const { data: byName } = await sb()
      .from("sections")
      .select("id, name, program_id, program_label, class_teacher, strength, academic_year")
      .eq("class_teacher", session.name)
      .order("name");

    let sections = byName || [];

    // Fallback: if nothing found by name, try the section_id stored in teacher_accounts
    if (sections.length === 0 && session.sectionId) {
      const { data: byId } = await sb()
        .from("sections")
        .select("id, name, program_id, program_label, class_teacher, strength, academic_year")
        .eq("id", session.sectionId)
        .maybeSingle();
      if (byId) sections = [byId];
    }

    return NextResponse.json({ sections });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
