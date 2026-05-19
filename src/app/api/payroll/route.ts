import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

// GET /api/payroll?month=5&year=2026   — all payroll for a month
// GET /api/payroll?staffId=xxx          — all payroll for a staff member
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month   = searchParams.get("month");
  const year    = searchParams.get("year");
  const staffId = searchParams.get("staffId");

  let query = sb().from("staff_payroll").select("*").order("staff_name");

  if (staffId) query = query.eq("staff_id", staffId);
  if (month)   query = query.eq("month", parseInt(month));
  if (year)    query = query.eq("year", parseInt(year));

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to fetch payroll" }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST /api/payroll — create or update payroll record
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { id, staffId, staffName, month, year, basicPay, hra, transportAllowance,
          otherAllowances, pfDeduction, otherDeductions, status, paymentDate,
          paymentMode, notes } = body;

  if (!staffId || !month || !year) {
    return NextResponse.json({ error: "staffId, month, year required" }, { status: 400 });
  }

  const record = {
    staff_id:            staffId,
    staff_name:          staffName || "",
    month:               parseInt(month),
    year:                parseInt(year),
    basic_pay:           parseFloat(basicPay) || 0,
    hra:                 parseFloat(hra) || 0,
    transport_allowance: parseFloat(transportAllowance) || 0,
    other_allowances:    parseFloat(otherAllowances) || 0,
    pf_deduction:        parseFloat(pfDeduction) || 0,
    other_deductions:    parseFloat(otherDeductions) || 0,
    status:              status || "draft",
    payment_date:        paymentDate || null,
    payment_mode:        paymentMode || "bank_transfer",
    notes:               notes || "",
    updated_at:          new Date().toISOString(),
  };

  if (id) {
    const { data, error } = await sb().from("staff_payroll").update(record).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: "Failed to update payroll" }, { status: 500 });
    return NextResponse.json({ success: true, data });
  }

  const { data, error } = await sb()
    .from("staff_payroll")
    .upsert(record, { onConflict: "staff_id,month,year" })
    .select()
    .single();
  if (error) return NextResponse.json({ error: "Failed to save payroll" }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// PATCH /api/payroll — update status only
export async function PATCH(req: Request) {
  const { id, status, paymentDate, paymentMode } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (status)      updates.status       = status;
  if (paymentDate) updates.payment_date = paymentDate;
  if (paymentMode) updates.payment_mode = paymentMode;

  const { data, error } = await sb().from("staff_payroll").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// DELETE /api/payroll?id=xxx
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { error } = await sb().from("staff_payroll").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  return NextResponse.json({ success: true });
}
