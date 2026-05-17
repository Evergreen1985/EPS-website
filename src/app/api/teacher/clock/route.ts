import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, staff_id, staff_name } = body; // action: "in" | "out"

    if (!action || !staff_name) {
      return NextResponse.json({ error: "action and staff_name required" }, { status: 400 });
    }

    const today = new Date().toISOString().split("T")[0];
    const now = new Date().toISOString();

    const payload: any = { staff_name, date: today, status: "present" };
    if (staff_id) payload.staff_id = staff_id;

    if (action === "in") {
      payload.clock_in = now;
    } else if (action === "out") {
      payload.clock_out = now;
    } else {
      return NextResponse.json({ error: "action must be 'in' or 'out'" }, { status: 400 });
    }

    const { data, error } = await sb()
      .from("staff_attendance")
      .upsert(payload, { onConflict: "staff_id,date" })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ record: data });
  } catch (e) {
    console.error("[teacher/clock POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get("staffId");
    const staffName = searchParams.get("staffName");
    const today = new Date().toISOString().split("T")[0];

    let query = sb().from("staff_attendance").select("*").eq("date", today);
    if (staffId) query = query.eq("staff_id", staffId);
    else if (staffName) query = query.eq("staff_name", staffName);

    const { data } = await query.maybeSingle();
    return NextResponse.json({ record: data || null });
  } catch (e) {
    console.error("[teacher/clock GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
