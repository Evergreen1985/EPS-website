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
  const { feeId, amount, childName, phone } = await req.json();
  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return NextResponse.json({ error: "Razorpay not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to Vercel env vars." }, { status: 500 });
  }

  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res  = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Basic ${auth}` },
      body: JSON.stringify({
        amount:   Math.round(amount * 100), // paise
        currency: "INR",
        receipt:  `fee_${feeId}`,
        notes:    { feeId, childName, phone },
      }),
    });

    const order = await res.json();
    if (order.error) return NextResponse.json({ error: order.error.description }, { status: 500 });
    return NextResponse.json({ success: true, order, keyId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Verify payment after success
export async function PATCH(req: Request) {
  const { feeId, paymentId, orderId, signature } = await req.json();
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

  // Verify signature
  const crypto   = await import("crypto");
  const expected = crypto.createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");

  if (expected !== signature) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  // Mark as paid
  await sb().from("fee_assignments").update({
    status:     "paid",
    payment_id: paymentId,
    paid_at:    new Date().toISOString(),
  }).eq("id", feeId);

  return NextResponse.json({ success: true });
}
