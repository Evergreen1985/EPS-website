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

    const [attRes, staffRes] = await Promise.all([
      client.from("staff_attendance").select("*").eq("date", date),
      client.from("staff").select("id, name, role, phone").eq("is_active", true),
    ]);

    const attendance = attRes.data || [];
    const staff = staffRes.data || [];

    // Merge staff with their attendance record for the day
    const merged = staff.map((s: any) => {
      const rec = attendance.find((a: any) => a.staff_id === s.id);
      return { ...s, attendance: rec || null };
    });

    return NextResponse.json({ staff: merged, date });
  } catch (e) {
    console.error("[owner/staff-attendance GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { staff_id, staff_name, date, clock_in, clock_out, status, notes } = body;

    if (!staff_id || !staff_name || !date) {
      return NextResponse.json({ error: "staff_id, staff_name, date required" }, { status: 400 });
    }

    const payload: any = {
      staff_id,
      staff_name,
      date,
      status: status || "present",
      notes: notes || null,
    };
    if (clock_in) payload.clock_in = clock_in;
    if (clock_out) payload.clock_out = clock_out;

    const { data, error } = await sb()
      .from("staff_attendance")
      .upsert(payload, { onConflict: "staff_id,date" })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ record: data });
  } catch (e) {
    console.error("[owner/staff-attendance POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
