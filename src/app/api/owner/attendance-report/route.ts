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
    const type = searchParams.get("type") || "children"; // "children" | "staff"
    const from = searchParams.get("from");
    const to   = searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json({ error: "from and to dates required" }, { status: 400 });
    }

    const client = sb();

    if (type === "children") {
      const [childrenRes, attRes] = await Promise.all([
        client.from("enquiries")
          .select("id, child_name, section_name, program_label")
          .eq("status", "enrolled"),
        client.from("attendance")
          .select("student_id, date, status")
          .gte("date", from)
          .lte("date", to),
      ]);

      const children = childrenRes.data || [];
      const attendance = attRes.data || [];

      const report = children.map((c: any) => {
        const recs = attendance.filter((a: any) => a.student_id === c.id);
        const present = recs.filter((a: any) => a.status === "present").length;
        const late    = recs.filter((a: any) => a.status === "late").length;
        const absent  = recs.filter((a: any) => a.status === "absent").length;
        const total   = recs.length;
        return {
          id:           c.id,
          child_name:   c.child_name,
          section_name: c.section_name || "—",
          program:      c.program_label || "—",
          present, late, absent,
          total_marked: total,
          rate: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
        };
      }).sort((a: any, b: any) => a.rate - b.rate); // worst attendance first

      return NextResponse.json({ type: "children", from, to, report });

    } else {
      // Staff report
      const [staffRes, attRes] = await Promise.all([
        client.from("staff").select("id, name, role").eq("is_active", true),
        client.from("staff_attendance")
          .select("staff_name, staff_id, date, status, clock_in, clock_out")
          .gte("date", from)
          .lte("date", to),
      ]);

      const staff = staffRes.data || [];
      const attendance = attRes.data || [];

      const report = staff.map((s: any) => {
        const recs = attendance.filter((a: any) => a.staff_id === s.id || a.staff_name === s.name);
        const present  = recs.filter((a: any) => a.status === "present").length;
        const absent   = recs.filter((a: any) => a.status === "absent").length;
        const leave    = recs.filter((a: any) => a.status === "leave").length;
        const half_day = recs.filter((a: any) => a.status === "half_day").length;
        const total    = recs.length;

        // Average clock-in time
        const clockIns = recs.filter((a: any) => a.clock_in).map((a: any) => new Date(a.clock_in));
        const avgClockIn = clockIns.length > 0
          ? new Date(clockIns.reduce((s, d) => s + d.getTime(), 0) / clockIns.length)
          : null;

        return {
          id: s.id,
          staff_name:    s.name,
          role:          s.role,
          present, absent, leave, half_day,
          total_marked:  total,
          avg_clock_in:  avgClockIn ? avgClockIn.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" }) : "—",
        };
      }).sort((a: any, b: any) => b.leave - a.leave); // most leave first

      return NextResponse.json({ type: "staff", from, to, report });
    }
  } catch (e) {
    console.error("[attendance-report]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
