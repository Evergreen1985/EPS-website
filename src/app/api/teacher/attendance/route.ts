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

    // Upsert attendance — no .select().single() to avoid RLS read-back failures
    const { error } = await sb()
      .from("attendance")
      .upsert({
        student_id:      studentId,
        date,
        status,
        check_in_time:   checkInTime  || null,
        check_out_time:  checkOutTime || null,
      }, { onConflict: "student_id,date" });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Sync to transport ride_logs (fire-and-forget — don't fail the attendance save if transport sync fails)
    try {
      if (status === "absent") {
        // Fetch child name and verify opt-in is active for today
        const [{ data: child }, { data: optIn }] = await Promise.all([
          sb().from("enquiries").select("child_name").eq("id", studentId).single(),
          sb().from("transport_opt_ins")
            .select("child_id, mode, end_date")
            .eq("child_id", studentId)
            .eq("opted_in", true)
            .maybeSingle(),
        ]);

        // Check that the opt-in is actually active for today's date
        const isActive = optIn && (
          optIn.mode === "permanent" ||
          !optIn.end_date ||
          optIn.end_date >= date
        );

        if (isActive && child) {
          const now  = new Date().toISOString();
          const base = { child_id: studentId, child_name: child.child_name, date, status: "absent", checked_by: "teacher-sync", updated_at: now };

          // Try new constraint (requires migration Section 9); fall back to old constraint
          const upsertRoute = async (route_id: string) => {
            const { error } = await sb().from("ride_logs").upsert({ ...base, route_id }, { onConflict: "child_id,date,route_id" });
            if (error && error.message.includes("route_id")) {
              await sb().from("ride_logs").upsert(base, { onConflict: "child_id,date" });
            }
          };
          await Promise.all([upsertRoute("route_morning"), upsertRoute("route_afternoon")]);
        }
      } else {
        // Teacher corrected to present/late — remove any auto-synced absent records
        await sb().from("ride_logs")
          .delete()
          .eq("child_id", studentId)
          .eq("date", date)
          .eq("status", "absent")
          .eq("checked_by", "teacher-sync");
      }
    } catch { /* transport sync failure must not affect attendance save */ }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
