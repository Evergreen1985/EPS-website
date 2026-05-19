import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

// GET /api/pickup?enquiryId=xxx        — authorizations for one child
// GET /api/pickup?all=true             — all authorizations (admin/teacher)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const enquiryId = searchParams.get("enquiryId");
  const all       = searchParams.get("all") === "true";

  if (all) {
    const { data, error } = await sb()
      .from("pickup_authorizations")
      .select("*, enquiries(child_name, phone, program_label, section_name)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    return NextResponse.json(data || []);
  }

  if (!enquiryId) return NextResponse.json({ error: "enquiryId required" }, { status: 400 });

  const { data, error } = await sb()
    .from("pickup_authorizations")
    .select("*")
    .eq("enquiry_id", enquiryId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST /api/pickup — add authorized person
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { enquiryId, childName, authorizedName, relation, phone, idType, idNumber, notes, addedBy } = body;

  if (!enquiryId || !authorizedName || !relation || !phone) {
    return NextResponse.json({ error: "enquiryId, authorizedName, relation and phone are required" }, { status: 400 });
  }

  const { data, error } = await sb()
    .from("pickup_authorizations")
    .insert({
      enquiry_id:      enquiryId,
      child_name:      childName      || "",
      authorized_name: authorizedName,
      relation,
      phone,
      id_type:         idType         || "aadhaar",
      id_number:       idNumber       || "",
      notes:           notes          || "",
      added_by:        addedBy        || "parent",
      is_active:       true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to add authorization" }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// PATCH /api/pickup — toggle active or update details
export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { id, isActive, authorizedName, relation, phone, idType, idNumber, notes } = body;

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (isActive        !== undefined) updates.is_active       = isActive;
  if (authorizedName  !== undefined) updates.authorized_name = authorizedName;
  if (relation        !== undefined) updates.relation        = relation;
  if (phone           !== undefined) updates.phone           = phone;
  if (idType          !== undefined) updates.id_type         = idType;
  if (idNumber        !== undefined) updates.id_number       = idNumber;
  if (notes           !== undefined) updates.notes           = notes;

  const { error } = await sb().from("pickup_authorizations").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE /api/pickup?id=xxx — remove authorization
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await sb().from("pickup_authorizations").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  return NextResponse.json({ success: true });
}
