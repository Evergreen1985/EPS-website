import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { getSchoolConfig } from "@/lib/getSchoolConfig";
import { sendWhatsApp } from "@/lib/twilio";

export const dynamic = "force-dynamic";

function sb() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
}

function generateOTP(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(100000 + (arr[0] % 900000));
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(`community-otp:${ip}`, 5, 15 * 60 * 1000))
    return NextResponse.json({ error: "Too many attempts. Please wait 15 minutes." }, { status: 429 });

  const { phone } = await req.json();
  const phoneClean = String(phone || "").replace(/\D/g, "");
  if (phoneClean.length < 10)
    return NextResponse.json({ error: "Enter a valid 10-digit phone number." }, { status: 400 });

  const otp       = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await sb().from("password_resets").insert({
    phone:      phoneClean,
    role:       "community",
    otp,
    expires_at: expiresAt.toISOString(),
  });

  const school  = await getSchoolConfig();
  const message = `🌿 *${school.name} — Community Chat*\n\nYour OTP to join the community chat is:\n\n🔢 *${otp}*\n\nValid for 10 minutes. Do not share with anyone.\n\n_${school.name} Team_`;
  const sent    = await sendWhatsApp(phoneClean, message);

  const waLink = sent ? null : `https://wa.me/91${school.contact.phone}?text=${encodeURIComponent(message)}`;

  return NextResponse.json({ success: true, sent, waLink, phone: phoneClean });
}
