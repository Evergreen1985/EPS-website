import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { getSchoolConfig } from "@/lib/getSchoolConfig";
import { sendWhatsApp } from "@/lib/twilio";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

function generateOTP(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(100000 + (array[0] % 900000));
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    if (!rateLimit(`reset-otp:${ip}`, 3, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many reset requests. Please try again later." }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const { phone, role } = body;

    if (!phone || !role) {
      return NextResponse.json({ error: "Phone and role required" }, { status: 400 });
    }

    if (!["parent", "teacher"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const client  = sb();
    const phoneId = String(phone).trim();

    if (role === "parent") {
      const { data } = await client.from("parent_accounts").select("id").eq("phone", phoneId).maybeSingle();
      if (!data) return NextResponse.json({ success: true, sent: false, waLink: null });
    } else {
      const { data } = await client.from("teacher_accounts").select("id").eq("username", phoneId.toLowerCase()).maybeSingle();
      if (!data) return NextResponse.json({ success: true, sent: false, waLink: null });
    }

    const otp       = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await client.from("password_resets").insert({
      phone: phoneId, role, otp, expires_at: expiresAt.toISOString(),
    });

    const school  = await getSchoolConfig();
    const message = `🔐 *${school.name} — Password Reset*\n\nYour OTP is: *${otp}*\n\nThis OTP is valid for 10 minutes.\nDo not share with anyone.\n\n*${school.name}*`;
    const sent    = await sendWhatsApp(phoneId, message);
    const waLink  = sent ? null : `https://wa.me/91${school.contact.phone}?text=${encodeURIComponent(message)}`;

    return NextResponse.json({ success: true, sent, waLink });

  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
