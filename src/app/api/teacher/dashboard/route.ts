import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sectionId = searchParams.get("sectionId");
  if (!sectionId) return NextResponse.json({ error: "sectionId required" }, { status: 400 });

  const today = new Date().toISOString().split("T")[0];
  const monthStart = today.slice(0, 7) + "-01";
  const [y, m] = today.slice(0,7).split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const monthEnd = `${today.slice(0,7)}-${String(lastDay).padStart(2,"0")}`;

  // Children in this section
  const { data: children } = await sb()
    .from("enquiries")
    .select("id, child_name, child_dob, child_age_months, phone, parent_name, status")
    .eq("section_id", sectionId)
    .order("child_name");

  // Today's attendance for this section
  const childIds = (children || []).map(c => c.id);
  let attendance: any[] = [];
  if (childIds.length > 0) {
    const { data: att } = await sb()
      .from("attendance")
      .select("*")
      .in("student_id", childIds)
      .eq("date", today);
    attendance = att || [];
  }

  // Homework assigned for this section this month
  const { data: homework } = await sb()
    .from("homework")
    .select("*")
    .eq("section_id", sectionId)
    .gte("due_date", monthStart)
    .order("due_date", { ascending: false });

  // Photos uploaded for this section
  const { data: photos } = await sb()
    .from("section_photos")
    .select("*")
    .eq("section_id", sectionId)
    .order("uploaded_at", { ascending: false })
    .limit(20);

  return NextResponse.json({
    children:   children   || [],
    attendance: attendance || [],
    homework:   homework   || [],
    photos:     photos     || [],
    today,
  });
}
