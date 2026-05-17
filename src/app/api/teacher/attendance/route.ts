import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

// Get attendance history for a section
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sectionId = searchParams.get("sectionId");
  const from      = searchParams.get("from");
  const to        = searchParams.get("to");

  if (!sectionId) return NextResponse.json({ error: "sectionId required" }, { status: 400 });

  // Validate date params — must be YYYY-MM-DD format if provided
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  if (from && !DATE_RE.test(from)) return NextResponse.json({ error: "Invalid from date" }, { status: 400 });
  if (to   && !DATE_RE.test(to))   return NextResponse.json({ error: "Invalid to date" },   { status: 400 });

  const { data: children } = await sb()
    .from("enquiries")
    .select("id, child_name")
    .eq("section_id", sectionId);

  const childIds = (children || []).map((c: any) => c.id);
  if (childIds.length === 0) return NextResponse.json({ attendance: [], children: [] });

  let query = sb()
    .from("attendance")
    .select("*")
    .in("student_id", childIds)
    .order("date", { ascending: false });

  if (from) query = (query as any).gte("date", from);
  if (to)   query = (query as any).lte("date", to);

  const { data, error } = await (query as any).limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ attendance: data || [], children: children || [] });
}

// Mark/update attendance for a student
export async function POST(req: Request) {
  try {
    const { studentId, date, status, checkInTime, checkOutTime } = await req.json().catch(() => ({}));
    if (!studentId || !date || !status) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
    if (!DATE_RE.test(date)) return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    if (!["present", "absent", "late"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Upsert attendance
    const { data, error } = await sb()
      .from("attendance")
      .upsert({
        student_id:      studentId,
        date,
        status,
        check_in_time:   checkInTime  || null,
        check_out_time:  checkOutTime || null,
      }, { onConflict: "student_id,date" })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
