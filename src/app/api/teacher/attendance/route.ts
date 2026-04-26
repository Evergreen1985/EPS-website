import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

// Mark/update attendance for a student
export async function POST(req: Request) {
  try {
    const { studentId, date, status, checkInTime, checkOutTime } = await req.json();
    if (!studentId || !date || !status) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

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
