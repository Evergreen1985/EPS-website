import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

// GET /api/referrals              — all referrals (admin)
// GET /api/referrals?enquiryId=x  — referrals made by a parent
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const enquiryId = searchParams.get("enquiryId");

  let query = sb().from("referrals").select("*").order("created_at", { ascending: false });
  if (enquiryId) query = query.eq("referrer_enquiry_id", enquiryId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST /api/referrals — create referral
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { referrerEnquiryId, referrerName, refereeName, refereePhone, refereeEmail, notes } = body;

  if (!referrerName || !refereeName || !refereePhone) {
    return NextResponse.json({ error: "referrerName, refereeName, refereePhone required" }, { status: 400 });
  }

  const { data, error } = await sb().from("referrals").insert({
    referrer_enquiry_id: referrerEnquiryId || null,
    referrer_name:       referrerName,
    referee_name:        refereeName,
    referee_phone:       refereePhone,
    referee_email:       refereeEmail || "",
    notes:               notes || "",
    updated_at:          new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: "Failed to create referral" }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// PATCH /api/referrals — update status / reward
export async function PATCH(req: Request) {
  const { id, status, rewardAmount, rewardGivenAt, notes } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (status        !== undefined) updates.status          = status;
  if (rewardAmount  !== undefined) updates.reward_amount   = rewardAmount;
  if (rewardGivenAt !== undefined) updates.reward_given_at = rewardGivenAt;
  if (notes         !== undefined) updates.notes           = notes;

  const { data, error } = await sb().from("referrals").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: "Failed to update referral" }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// DELETE /api/referrals?id=xxx
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { error } = await sb().from("referrals").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  return NextResponse.json({ success: true });
}
