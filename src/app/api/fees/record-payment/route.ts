import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

// POST — record a cash / offline payment
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      feeId,
      paidAmount,      // actual amount paid (can be partial)
      paymentMode,     // cash | cheque | bank_transfer | upi
      paymentDate,     // ISO date string
      receivedBy,      // staff name
      referenceNumber, // cheque no / UTR / UPI ref
      notes,
      applyDiscount,   // boolean
      discountAmount,  // ₹ amount
      discountReason,  // reason string
    } = body;

    if (!feeId || !paidAmount || !paymentMode) {
      return NextResponse.json({ error: "feeId, paidAmount and paymentMode are required" }, { status: 400 });
    }

    const client = sb();

    // Fetch the existing fee record
    const { data: fee, error: fetchErr } = await client
      .from("fee_assignments")
      .select("*")
      .eq("id", feeId)
      .single();

    if (fetchErr || !fee) {
      return NextResponse.json({ error: "Fee record not found" }, { status: 404 });
    }

    // Calculate effective amount after discount
    const discount   = applyDiscount ? (discountAmount || 0) : 0;
    const netAmount  = fee.amount - discount;
    const paid       = parseFloat(paidAmount);
    const isFullPaid = paid >= netAmount;

    // Generate receipt number for this payment
    const { data: receiptData } = await client
      .rpc("generate_receipt_number");
    const receiptNumber = receiptData || `EPS-RCP-${Date.now()}`;

    // Update the fee record
    const { data: updated, error: updateErr } = await client
      .from("fee_assignments")
      .update({
        status:           isFullPaid ? "paid" : "partial",
        paid_amount:      paid,
        payment_mode:     paymentMode,
        payment_date:     paymentDate || new Date().toISOString().split("T")[0],
        received_by:      receivedBy || null,
        reference_number: referenceNumber || null,
        receipt_number:   receiptNumber,
        notes:            notes || null,
        discount_amount:  discount,
        discount_reason:  discount > 0 ? (discountReason || null) : null,
        paid_at:          new Date().toISOString(),
      })
      .eq("id", feeId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      receiptNumber,
      isFullPaid,
      balance: Math.max(0, netAmount - paid),
      data: updated,
    });

  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
