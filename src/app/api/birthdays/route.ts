import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

// GET /api/birthdays?days=30  — children with birthdays in next N days
// GET /api/birthdays?month=5  — children with birthdays in a specific month
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const days  = parseInt(searchParams.get("days") || "30");
  const month = searchParams.get("month");

  const { data, error } = await sb()
    .from("enquiries")
    .select("id, child_name, child_dob, section_name, program_label, parent_name, phone")
    .not("child_dob", "is", null)
    .neq("status", "not-interested");

  if (error) return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = (data || [])
    .map(child => {
      if (!child.child_dob) return null;
      const dob = new Date(child.child_dob);
      const thisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      let nextBirthday = thisYear;
      if (thisYear < today) {
        nextBirthday = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate());
      }
      const daysUntil = Math.ceil((nextBirthday.getTime() - today.getTime()) / 86400000);
      const isToday   = daysUntil === 0;
      const age       = today.getFullYear() - dob.getFullYear() + (isToday ? 0 : (thisYear <= today ? 0 : -1));

      return {
        ...child,
        dob:          child.child_dob,
        daysUntil,
        isToday,
        age,
        month:        dob.getMonth() + 1,
        nextBirthday: nextBirthday.toISOString().split("T")[0],
      };
    })
    .filter(c => {
      if (!c) return false;
      if (month) return c.month === parseInt(month);
      return c.daysUntil <= days;
    })
    .sort((a, b) => (a!.daysUntil - b!.daysUntil));

  return NextResponse.json(result);
}
