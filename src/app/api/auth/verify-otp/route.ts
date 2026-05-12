import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

export async function POST(req: Request) {
  const { phone, otp, newPassword, role } = await req.json();
  if (!phone || !otp || !newPassword || !role) return NextResponse.json({ error: "All fields required" }, { status: 400 });

  const client = sb();

  // Verify OTP
  const { data: reset } = await client.from("password_resets")
    .select("*").eq("phone", phone.trim()).eq("otp", otp).eq("role", role).eq("used", false)
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1).maybeSingle();

  if (!reset) return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });

  // Update password
  if (role === "parent") {
    await client.from("parent_accounts").update({ password: newPassword }).eq("phone", phone.trim());
  } else if (role === "teacher") {
    await client.from("teacher_accounts").update({ password_hash: newPassword }).eq("username", phone.trim().toLowerCase());
  }

  // Mark OTP as used
  await client.from("password_resets").update({ used: true }).eq("id", reset.id);

  return NextResponse.json({ success: true });
}
