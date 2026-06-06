import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

// GET /api/ptm?type=slots&date=2026-05-20   — available slots
// GET /api/ptm?type=bookings&slotId=xxx      — bookings for a slot
// GET /api/ptm?type=bookings&enquiryId=xxx   — parent's bookings
// GET /api/ptm?type=all                      — all slots with booking counts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type      = searchParams.get("type") || "slots";
  const date      = searchParams.get("date");
  const slotId    = searchParams.get("slotId");
  const enquiryId = searchParams.get("enquiryId");

  if (type === "all") {
    const { data, error } = await sb()
      .from("ptm_slots")
      .select("*, ptm_bookings(id, child_name, parent_name, phone, status)")
      .order("slot_date").order("start_time");
    if (error) return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    return NextResponse.json(data || []);
  }

  if (type === "bookings") {
    let query = sb().from("ptm_bookings").select("*, ptm_slots(slot_date, start_time, end_time, teacher_name, section_name)");
    if (slotId)    query = query.eq("slot_id", slotId);
    if (enquiryId) query = query.eq("enquiry_id", enquiryId);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
    return NextResponse.json(data || []);
  }

  // Default: available slots — scoped to the requested section so a parent only
  // sees their child's section's PTM (plus any school-wide slots with no section).
  const section = searchParams.get("sectionName") || searchParams.get("sectionId") || searchParams.get("section");
  let query = sb().from("ptm_slots")
    .select("*, ptm_bookings(id)")
    .eq("is_active", true)
    .order("slot_date").order("start_time");
  if (date) query = query.eq("slot_date", date);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 });
  let slots = data || [];
  if (section) slots = slots.filter((s: any) => !s.section_name || s.section_name === section);
  return NextResponse.json(slots);
}

// POST /api/ptm — create slot or booking
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { action } = body;

  if (action === "book") {
    const { slotId, enquiryId, childName, parentName, phone, notes } = body;
    if (!slotId || !childName || !parentName || !phone) {
      return NextResponse.json({ error: "slotId, childName, parentName, phone required" }, { status: 400 });
    }
    const { data, error } = await sb().from("ptm_bookings")
      .insert({ slot_id: slotId, enquiry_id: enquiryId || null, child_name: childName, parent_name: parentName, phone, notes: notes || "" })
      .select().single();
    if (error) return NextResponse.json({ error: "Failed to book slot" }, { status: 500 });
    return NextResponse.json({ success: true, data });
  }

  // Create slot
  const { slotDate, startTime, endTime, teacherName, sectionName, maxBookings, notes } = body;
  if (!slotDate || !startTime || !endTime || !teacherName) {
    return NextResponse.json({ error: "slotDate, startTime, endTime, teacherName required" }, { status: 400 });
  }

  // Resolve the section — callers may send a section name OR a section id.
  // Store the real section NAME so scoping stays consistent.
  let resolvedName = (sectionName || "").trim();
  if (resolvedName) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedName);
    const { data: sec } = await sb()
      .from("sections")
      .select("name")
      .eq(isUuid ? "id" : "name", resolvedName)
      .maybeSingle()
      .then((r) => r, () => ({ data: null }));
    if (sec?.name) resolvedName = sec.name;
  }

  const { data, error } = await sb().from("ptm_slots")
    .insert({ slot_date: slotDate, start_time: startTime, end_time: endTime, teacher_name: teacherName, section_name: resolvedName, max_bookings: maxBookings || 1, notes: notes || "" })
    .select().single();
  if (error) return NextResponse.json({ error: "Failed to create slot" }, { status: 500 });

  // Surface the PTM to parents as a calendar event (tagged with the section via
  // `affects` so the parent app can scope it; school-wide if no section).
  await sb().from("calendar_events").insert({
    title:       resolvedName ? `PTM — ${resolvedName}` : "Parent-Teacher Meeting",
    event_date:  slotDate,
    event_type:  "ptm",
    description: `Parent-Teacher Meeting ${startTime}–${endTime}${teacherName ? ` with ${teacherName}` : ""}.${notes ? ` ${notes}` : ""}`,
    affects:     resolvedName || "all",
    icon:        "👨‍👩‍👧",
    color:       "#8B5CF6",
    created_by:  teacherName || "teacher",
  }).then((r) => r, () => null); // non-fatal: slot is created even if the event insert fails

  return NextResponse.json({ success: true, data });
}

// PATCH /api/ptm — update slot or booking status
export async function PATCH(req: Request) {
  const { id, type, status, isActive } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  if (type === "booking") {
    const { data, error } = await sb().from("ptm_bookings").update({ status }).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
    return NextResponse.json({ success: true, data });
  }

  // Update slot
  const updates: Record<string, any> = {};
  if (isActive !== undefined) updates.is_active = isActive;
  const { data, error } = await sb().from("ptm_slots").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: "Failed to update slot" }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// DELETE /api/ptm?id=xxx&type=slot|booking
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id   = searchParams.get("id");
  const type = searchParams.get("type") || "slot";
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const table = type === "booking" ? "ptm_bookings" : "ptm_slots";
  const { error } = await sb().from(table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  return NextResponse.json({ success: true });
}
