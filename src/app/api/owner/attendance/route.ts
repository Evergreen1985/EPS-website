import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const client = sb();

    const [attRes, enquiriesRes] = await Promise.all([
      client.from("attendance").select("*").eq("date", date),
      client.from("enquiries").select("id, child_name, section_name, program_label, status").eq("status", "enrolled"),
    ]);

    const attendance = attRes.data || [];
    const children = enquiriesRes.data || [];

    // Merge
    const merged = children.map((c: any) => {
      const rec = attendance.find((a: any) => a.student_id === c.id);
      return { ...c, attendance: rec || null };
    });

    // Group by section
    const sections: Record<string, any[]> = {};
    merged.forEach((c: any) => {
      const sec = c.section_name || "Unassigned";
      if (!sections[sec]) sections[sec] = [];
      sections[sec].push(c);
    });

    return NextResponse.json({ date, sections, total: children.length, attendance });
  } catch (e) {
    console.error("[owner/attendance GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
