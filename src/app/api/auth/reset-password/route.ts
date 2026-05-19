import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { getSchoolConfig } from "@/lib/getSchoolConfig";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

function generateOTP(): string {
  // Cryptographically random 6-digit OTP
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(100000 + (array[0] % 900000));
}

// POST: Send OTP via WhatsApp link
export async function POST(req: Request) {
  try {
    // Rate limit: 3 OTP requests per IP per 15 minutes
    const ip = getClientIp(req);
    if (!rateLimit(`reset-otp:${ip}`, 3, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many reset requests. Please try again later." }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const { phone, role } = body;

    if (!phone || !role) {
      return NextResponse.json({ error: "Phone and role required" }, { status: 400 });
    }

    // Validate role
    if (!["parent", "teacher"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const client  = sb();
    const phoneId = String(phone).trim();

    // Check account exists — return a generic message either way to prevent enumeration
    if (role === "parent") {
      const { data } = await client.from("parent_accounts").select("id").eq("phone", phoneId).maybeSingle();
      if (!data) {
        // Return success to prevent phone number enumeration
        return NextResponse.json({ success: true, waLink: null });
      }
    } else {
      const { data } = await client.from("teacher_accounts").select("id").eq("username", phoneId.toLowerCase()).maybeSingle();
      if (!data) {
        return NextResponse.json({ success: true, waLink: null });
      }
    }

    const otp       = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP
    await client.from("password_resets").insert({
      phone: phoneId,
      role,
      otp,
      expires_at: expiresAt.toISOString(),
    });

    // Generate WhatsApp link with OTP
    const school  = await getSchoolConfig();
    const message = `🔐 *${school.name} — Password Reset*\n\nYour OTP is: *${otp}*\n\nThis OTP is valid for 10 minutes.\nDo not share with anyone.\n\n*${school.name}*`;
    const waLink  = `https://wa.me/91${school.contact.phone}?text=${encodeURIComponent(message)}`;

    // OTP is NOT returned in the response — it is delivered only via WhatsApp
    return NextResponse.json({ success: true, waLink });

  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
