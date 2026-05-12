import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

// GET: fees for a child or all
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const enquiryId = searchParams.get("enquiryId");
  const status    = searchParams.get("status");

  let query = sb().from("fee_assignments").select("*, fee_structures(name, fee_type)").order("due_date", { ascending: false });
  if (enquiryId) query = query.eq("enquiry_id", enquiryId);
  if (status)    query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST: assign fee to a child
export async function POST(req: Request) {
  const body = await req.json();
  const { enquiryId, childName, feeStructureId, feeType, amount, dueDate, periodLabel, notes } = body;
  if (!enquiryId || !amount || !dueDate) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const receiptNo = `EPS-${Date.now().toString().slice(-8)}`;
  const { data, error } = await sb().from("fee_assignments").insert({
    enquiry_id: enquiryId, child_name: childName,
    fee_structure_id: feeStructureId, fee_type: feeType,
    amount, due_date: dueDate, period_label: periodLabel,
    status: "pending", receipt_no: receiptNo, notes,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// PATCH: update fee status (mark paid, waived etc)
export async function PATCH(req: Request) {
  const { id, status, paymentId, paidAt, notes } = await req.json();
  const updates: any = { status };
  if (paymentId) updates.payment_id = paymentId;
  if (paidAt)    updates.paid_at    = paidAt;
  if (notes)     updates.notes      = notes;

  const { error } = await sb().from("fee_assignments").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
