import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

// GET /api/incidents                   — all incidents (admin)
// GET /api/incidents?enquiryId=xxx     — for a specific child
// GET /api/incidents?date=2026-05-20   — on a date
// GET /api/incidents?severity=high     — by severity
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const enquiryId = searchParams.get("enquiryId");
  const date      = searchParams.get("date");
  const severity  = searchParams.get("severity");

  let query = sb().from("incidents").select("*").order("incident_date", { ascending: false }).order("created_at", { ascending: false });

  if (enquiryId) query = query.eq("enquiry_id", enquiryId);
  if (date)      query = query.eq("incident_date", date);
  if (severity)  query = query.eq("severity", severity);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to fetch incidents" }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST /api/incidents — create
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const {
    enquiryId, childName, sectionName, incidentDate, incidentTime,
    incidentType, severity, description, actionTaken, reportedBy,
    parentNotified, parentNotifiedVia, followUpRequired, followUpNotes,
  } = body;

  if (!childName || !incidentDate || !description || !reportedBy) {
    return NextResponse.json({ error: "childName, incidentDate, description, reportedBy required" }, { status: 400 });
  }

  const { data, error } = await sb().from("incidents").insert({
    enquiry_id:          enquiryId || null,
    child_name:          childName,
    section_name:        sectionName || "",
    incident_date:       incidentDate,
    incident_time:       incidentTime || null,
    incident_type:       incidentType || "other",
    severity:            severity || "low",
    description,
    action_taken:        actionTaken || "",
    reported_by:         reportedBy,
    parent_notified:     parentNotified || false,
    parent_notified_at:  parentNotified ? new Date().toISOString() : null,
    parent_notified_via: parentNotifiedVia || "",
    follow_up_required:  followUpRequired || false,
    follow_up_notes:     followUpNotes || "",
    updated_at:          new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: "Failed to create incident" }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// PATCH /api/incidents — update
export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  const map: Record<string, string> = {
    actionTaken: "action_taken", parentNotified: "parent_notified",
    parentNotifiedVia: "parent_notified_via", followUpRequired: "follow_up_required",
    followUpNotes: "follow_up_notes", severity: "severity", description: "description",
  };
  for (const [k, col] of Object.entries(map)) {
    if (fields[k] !== undefined) {
      updates[col] = fields[k];
      if (k === "parentNotified" && fields[k]) updates.parent_notified_at = new Date().toISOString();
    }
  }

  const { data, error } = await sb().from("incidents").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: "Failed to update incident" }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// DELETE /api/incidents?id=xxx
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { error } = await sb().from("incidents").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  return NextResponse.json({ success: true });
}
