import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

// GET /api/followups                        — all (admin)
// GET /api/followups?enquiryId=xxx          — for one lead
// GET /api/followups?date=2026-05-20        — due on date
// GET /api/followups?status=pending         — by status
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const enquiryId = searchParams.get("enquiryId");
  const date      = searchParams.get("date");
  const status    = searchParams.get("status");

  let query = sb()
    .from("lead_followups")
    .select("*, enquiries(child_name, parent_name, phone, status)")
    .order("followup_date");

  if (enquiryId) query = query.eq("enquiry_id", enquiryId);
  if (date)      query = query.eq("followup_date", date);
  if (status)    query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to fetch follow-ups" }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST /api/followups — create follow-up
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { enquiryId, followupDate, notes, addedBy } = body;
  if (!enquiryId || !followupDate) {
    return NextResponse.json({ error: "enquiryId and followupDate required" }, { status: 400 });
  }

  const { data, error } = await sb().from("lead_followups").insert({
    enquiry_id:    enquiryId,
    followup_date: followupDate,
    notes:         notes || "",
    status:        "pending",
    added_by:      addedBy || "admin",
  }).select().single();

  if (error) return NextResponse.json({ error: "Failed to create follow-up" }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// PATCH /api/followups — update status / notes
export async function PATCH(req: Request) {
  const { id, status, notes, followupDate } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updates: Record<string, any> = {};
  if (status      !== undefined) updates.status        = status;
  if (notes       !== undefined) updates.notes         = notes;
  if (followupDate!== undefined) updates.followup_date = followupDate;

  const { data, error } = await sb().from("lead_followups").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: "Failed to update follow-up" }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// DELETE /api/followups?id=xxx
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { error } = await sb().from("lead_followups").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  return NextResponse.json({ success: true });
}
