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
  const phone = searchParams.get("phone");
  const month = searchParams.get("month"); // format YYYY-MM
  if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 400 });

  const client = sb();
  const now = new Date();
  const m = month || `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;

  // Children linked to this phone
  const { data: enquiries } = await client
    .from("enquiries")
    .select("id,child_name,child_dob,child_age_months,program_label,program_id,status,section_id,section_name,created_at")
    .eq("phone", phone.trim())
    .order("created_at", { ascending: false });

  // Calendar events for this month (dynamic from DB)
  const [y, mo] = m.split("-").map(Number);
  const lastDay = new Date(y, mo, 0).getDate();
  const { data: calendarEvents } = await client
    .from("calendar_events")
    .select("*")
    .gte("event_date", `${m}-01`)
    .lte("event_date", `${m}-${String(lastDay).padStart(2,"0")}`)
    .order("event_date");

  // Announcements
  const { data: announcements } = await client
    .from("announcements")
    .select("*")
    .or("target.eq.all,target.eq.parents")
    .order("created_at", { ascending: false })
    .limit(5);

  // Homework — only for sections that are assigned
  const sectionIds = (enquiries || []).map(e => e.section_id).filter(Boolean);
  let homework: any[] = [];
  if (sectionIds.length > 0) {
    const { data: hw } = await client
      .from("homework")
      .select("*")
      .in("section_id", sectionIds)
      .gte("due_date", `${m}-01`)
      .order("due_date");
    homework = hw || [];
  }

  // Photos — only for assigned sections
  let photos: any[] = [];
  if (sectionIds.length > 0) {
    const { data: ph } = await client
      .from("section_photos")
      .select("*")
      .in("section_id", sectionIds)
      .order("uploaded_at", { ascending: false })
      .limit(20);
    photos = ph || [];
  }

  return NextResponse.json({
    enquiries:     enquiries     || [],
    calendarEvents: calendarEvents || [],
    announcements: announcements || [],
    homework:      homework,
    photos:        photos,
  });
}
