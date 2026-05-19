import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

// GET /api/medical?enquiryId=xxx        — single child record
// GET /api/medical?all=true             — all records joined with child name (admin)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const enquiryId = searchParams.get("enquiryId");
  const all       = searchParams.get("all") === "true";

  if (all) {
    const { data, error } = await sb()
      .from("child_medical")
      .select("*, enquiries(child_name, phone, program_label, section_name)")
      .order("updated_at", { ascending: false });
    if (error) return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
    return NextResponse.json(data || []);
  }

  if (!enquiryId) return NextResponse.json({ error: "enquiryId required" }, { status: 400 });

  const { data, error } = await sb()
    .from("child_medical")
    .select("*")
    .eq("enquiry_id", enquiryId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Failed to fetch record" }, { status: 500 });
  return NextResponse.json(data || null);
}

// POST /api/medical — create a new record
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { enquiryId, childName, ...fields } = body;

  if (!enquiryId) return NextResponse.json({ error: "enquiryId required" }, { status: 400 });

  const { data, error } = await sb()
    .from("child_medical")
    .insert({
      enquiry_id:         enquiryId,
      child_name:         childName || "",
      blood_group:        fields.bloodGroup        || "",
      allergies:          fields.allergies          || [],
      vaccinations:       fields.vaccinations       || [],
      emergency_contacts: fields.emergencyContacts  || [],
      medical_conditions: fields.medicalConditions  || "",
      special_needs:      fields.specialNeeds       || "",
      doctor_name:        fields.doctorName         || "",
      doctor_phone:       fields.doctorPhone        || "",
      insurance_provider: fields.insuranceProvider  || "",
      updated_by:         fields.updatedBy          || "parent",
      updated_at:         new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    // Unique constraint — record already exists, do an upsert via PATCH logic
    if (error.code === "23505") {
      return NextResponse.json({ error: "Record already exists. Use PATCH to update." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create record" }, { status: 500 });
  }
  return NextResponse.json({ success: true, data });
}

// PATCH /api/medical — update by enquiry_id (upsert)
export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { enquiryId, childName, ...fields } = body;

  if (!enquiryId) return NextResponse.json({ error: "enquiryId required" }, { status: 400 });

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };

  if (childName               !== undefined) updates.child_name          = childName;
  if (fields.bloodGroup       !== undefined) updates.blood_group         = fields.bloodGroup;
  if (fields.allergies        !== undefined) updates.allergies           = fields.allergies;
  if (fields.vaccinations     !== undefined) updates.vaccinations        = fields.vaccinations;
  if (fields.emergencyContacts!== undefined) updates.emergency_contacts  = fields.emergencyContacts;
  if (fields.medicalConditions!== undefined) updates.medical_conditions  = fields.medicalConditions;
  if (fields.specialNeeds     !== undefined) updates.special_needs       = fields.specialNeeds;
  if (fields.doctorName       !== undefined) updates.doctor_name         = fields.doctorName;
  if (fields.doctorPhone      !== undefined) updates.doctor_phone        = fields.doctorPhone;
  if (fields.insuranceProvider!== undefined) updates.insurance_provider  = fields.insuranceProvider;
  if (fields.updatedBy        !== undefined) updates.updated_by          = fields.updatedBy;

  // Upsert so parents can save even if record doesn't exist yet
  const { data, error } = await sb()
    .from("child_medical")
    .upsert({ enquiry_id: enquiryId, ...updates }, { onConflict: "enquiry_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to update record" }, { status: 500 });
  return NextResponse.json({ success: true, data });
}
