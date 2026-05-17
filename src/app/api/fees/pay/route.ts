import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

// Create Razorpay order
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { feeId, amount, childName, phone } = body;

    if (!feeId || !amount) {
      return NextResponse.json({ error: "feeId and amount are required" }, { status: 400 });
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const keyId     = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 });
    }

    // Verify the fee record exists before creating an order
    const { data: fee } = await sb().from("fee_assignments").select("id, amount, status").eq("id", feeId).maybeSingle();
    if (!fee) {
      return NextResponse.json({ error: "Fee record not found" }, { status: 404 });
    }
    if (fee.status === "paid") {
      return NextResponse.json({ error: "Fee is already paid" }, { status: 400 });
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res  = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Basic ${auth}` },
      body: JSON.stringify({
        amount:   Math.round(amountNum * 100), // paise
        currency: "INR",
        receipt:  `fee_${feeId}`.slice(0, 40),
        notes:    { feeId, childName: String(childName || "").slice(0, 50), phone: String(phone || "").slice(0, 15) },
      }),
    });

    const order = await res.json();
    if (order.error) return NextResponse.json({ error: "Payment order creation failed" }, { status: 500 });
    return NextResponse.json({ success: true, order, keyId });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Verify payment after success and mark fee as paid
export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { feeId, paymentId, orderId, signature } = body;

    if (!feeId || !paymentId || !orderId || !signature) {
      return NextResponse.json({ error: "feeId, paymentId, orderId and signature are required" }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 });
    }

    // Verify Razorpay signature — orderId|paymentId signed with key secret
    const crypto   = await import("crypto");
    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(`${String(orderId)}|${String(paymentId)}`)
      .digest("hex");

    // Use timing-safe comparison to prevent timing attacks
    const sigBuffer      = Buffer.from(String(signature), "hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    const sigValid = sigBuffer.length === expectedBuffer.length &&
                     crypto.timingSafeEqual(sigBuffer, expectedBuffer);

    if (!sigValid) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    // Verify fee record exists before updating
    const { data: fee } = await sb().from("fee_assignments").select("id, status").eq("id", feeId).maybeSingle();
    if (!fee) {
      return NextResponse.json({ error: "Fee record not found" }, { status: 404 });
    }
    if (fee.status === "paid") {
      // Idempotent — already paid, return success
      return NextResponse.json({ success: true });
    }

    await sb().from("fee_assignments").update({
      status:       "paid",
      payment_id:   String(paymentId),
      payment_mode: "razorpay",
      paid_at:      new Date().toISOString(),
    }).eq("id", feeId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
