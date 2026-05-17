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
  const month   = searchParams.get("month");    // format: 2026-04
  const year    = searchParams.get("year");     // format: 2026
  const yearEnd = searchParams.get("yearEnd");  // format: 2027 (for academic year range)
  let query = sb().from("calendar_events").select("*").order("event_date");
  if (month) {
    const [y, m] = month.split("-").map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    query = query
      .gte("event_date", `${month}-01`)
      .lte("event_date", `${month}-${String(lastDay).padStart(2,"0")}`);
  } else if (year) {
    const endYear = yearEnd || year;
    query = query.gte("event_date", `${year}-01-01`).lte("event_date", `${endYear}-12-31`);
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { data, error } = await sb().from("calendar_events").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function PATCH(req: Request) {
  const { id, ...updates } = await req.json();
  const { data, error } = await sb().from("calendar_events").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  const { error } = await sb().from("calendar_events").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
