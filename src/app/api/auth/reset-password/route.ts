import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST: Send OTP via WhatsApp link
export async function POST(req: Request) {
  const { phone, role } = await req.json();
  if (!phone || !role) return NextResponse.json({ error: "Phone and role required" }, { status: 400 });

  const client = sb();

  // Check account exists
  if (role === "parent") {
    const { data } = await client.from("parent_accounts").select("id").eq("phone", phone.trim()).maybeSingle();
    if (!data) return NextResponse.json({ error: "No account found with this phone number" }, { status: 404 });
  } else if (role === "teacher") {
    const { data } = await client.from("teacher_accounts").select("id").eq("username", phone.trim().toLowerCase()).maybeSingle();
    if (!data) return NextResponse.json({ error: "No teacher account found with this username" }, { status: 404 });
  }

  const otp       = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Save OTP
  await client.from("password_resets").insert({ phone: phone.trim(), role, otp, expires_at: expiresAt.toISOString() });

  // Generate WhatsApp link with OTP
  const message = `🔐 *Evergreen Preschool — Password Reset*\n\nYour OTP is: *${otp}*\n\nThis OTP is valid for 10 minutes.\nDo not share with anyone.\n\n*Evergreen Preschool & Daycare*`;
  const waLink  = `https://wa.me/917411574504?text=${encodeURIComponent(message)}`;

  return NextResponse.json({ success: true, waLink, otp }); // remove otp from response in production
}
