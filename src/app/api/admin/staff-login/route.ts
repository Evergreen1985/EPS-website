import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

function generateUsername(name: string): string {
  const parts = name.trim().toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "teacher";
  if (parts.length === 1) return parts[0];
  return `${parts[0]}.${parts[parts.length - 1]}`;
}

export async function POST(req: NextRequest) {
  try {
    const { name, phone, role } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

    const client = sb();
    const baseUsername = generateUsername(name);

    // Ensure unique username
    let username = baseUsername;
    let attempt = 1;
    while (true) {
      const { data } = await client.from("teacher_accounts").select("id").eq("username", username).maybeSingle();
      if (!data) break;
      attempt++;
      username = `${baseUsername}${attempt}`;
    }

    // Check this staff member doesn't already have an account
    const { data: existing } = await client.from("teacher_accounts").select("id, username").eq("name", name.trim()).maybeSingle();
    if (existing) {
      return NextResponse.json({ error: `Login already exists for this staff member (username: ${existing.username})` }, { status: 400 });
    }

    const phoneClean = String(phone || "").replace(/\D/g, "");
    const last4      = phoneClean.length >= 4 ? phoneClean.slice(-4) : "1234";
    const plainPass  = `Evergreen@${last4}`;
    const hash       = await bcrypt.hash(plainPass, 10);

    const { error } = await client.from("teacher_accounts").insert({
      username,
      name:          name.trim(),
      password_hash: hash,
      role:          role || "Teacher",
      status:        "active",
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const firstName = name.trim().split(" ")[0];
    const sitePhone = process.env.SCHOOL_PHONE || "7411574504";
    const waMsg = `🌿 *Evergreen Preschool — Staff Portal*\n\nDear ${firstName},\n\nYour teacher portal login has been created!\n\n🔐 *Login Credentials:*\n👤 Username: ${username}\n🔑 Password: ${plainPass}\n\n🌐 Login at: https://evergreenprepschools.com/teacher-login\n\n⚠️ Please save these and change your password after first login.\n\n_Evergreen Preschool & Daycare_`;
    const waUrl = phoneClean ? `https://wa.me/91${phoneClean}?text=${encodeURIComponent(waMsg)}` : null;

    return NextResponse.json({ success: true, username, password: plainPass, waUrl });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
