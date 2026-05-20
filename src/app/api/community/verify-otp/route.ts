import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

function sb() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(`community-verify:${ip}`, 8, 15 * 60 * 1000))
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });

  const { phone, otp } = await req.json();
  const phoneClean = String(phone || "").replace(/\D/g, "");

  if (!phoneClean || !otp)
    return NextResponse.json({ error: "Phone and OTP required." }, { status: 400 });

  if (!/^\d{6}$/.test(String(otp).trim()))
    return NextResponse.json({ error: "OTP must be 6 digits." }, { status: 400 });

  const { data: reset } = await sb()
    .from("password_resets")
    .select("id")
    .eq("phone", phoneClean)
    .eq("otp", String(otp).trim())
    .eq("role", "community")
    .eq("used", false)
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!reset)
    return NextResponse.json({ error: "Invalid or expired OTP. Please try again." }, { status: 400 });

  await sb().from("password_resets").update({ used: true }).eq("id", reset.id);

  return NextResponse.json({ success: true, phone: phoneClean });
}
