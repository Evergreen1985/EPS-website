import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

export async function POST(req: Request) {
  try {
    // Rate limit: 5 OTP attempts per IP per 15 minutes
    const ip = getClientIp(req);
    if (!rateLimit(`verify-otp:${ip}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many attempts. Please request a new OTP." }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const { phone, otp, newPassword, role } = body;

    if (!phone || !otp || !newPassword || !role) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    // Validate role
    if (!["parent", "teacher"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Enforce minimum password length
    if (String(newPassword).length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Validate OTP format — 6 digits only
    if (!/^\d{6}$/.test(String(otp))) {
      return NextResponse.json({ error: "Invalid OTP format" }, { status: 400 });
    }

    const client   = sb();
    const phoneId  = String(phone).trim();

    // Verify OTP — must be unused and not expired
    const { data: reset } = await client
      .from("password_resets")
      .select("*")
      .eq("phone", phoneId)
      .eq("otp", otp)
      .eq("role", role)
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!reset) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    // Hash new password before storing
    const passwordHash = await bcrypt.hash(String(newPassword).slice(0, 128), 10);

    if (role === "parent") {
      await client.from("parent_accounts")
        .update({ password_hash: passwordHash, is_first_login: false })
        .eq("phone", phoneId);
    } else if (role === "teacher") {
      await client.from("teacher_accounts")
        .update({ password_hash: passwordHash })
        .eq("username", phoneId.toLowerCase());
    }

    // Mark OTP as used immediately to prevent replay
    await client.from("password_resets").update({ used: true }).eq("id", reset.id);

    return NextResponse.json({ success: true });

  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
