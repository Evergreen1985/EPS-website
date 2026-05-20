import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { getSchoolConfig } from "@/lib/getSchoolConfig";
import { sendWhatsApp } from "@/lib/twilio";

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

function defaultPassword(phone: string, prefix: string): string {
  const clean = String(phone || "").replace(/\D/g, "");
  const last4 = clean.length >= 4 ? clean.slice(-4) : "1234";
  return `${prefix}@${last4}`;
}

function buildWaMsg(phone: string, name: string, username: string, password: string, schoolName: string, domain: string): { msg: string; waUrl: string | null } {
  const clean     = String(phone || "").replace(/\D/g, "");
  const firstName = name.trim().split(" ")[0];
  const msg       = `🌿 *${schoolName} — Staff Portal*\n\nDear ${firstName},\n\nYour teacher portal login credentials:\n\n👤 Username: ${username}\n🔑 Password: ${password}\n\n🌐 Login at: ${domain}/teacher-login\n\n⚠️ Please save these and change your password after first login.\n\n_${schoolName}_`;
  const waUrl     = clean ? `https://wa.me/91${clean}?text=${encodeURIComponent(msg)}` : null;
  return { msg, waUrl };
}

// POST — action: "create" | "reset"
export async function POST(req: NextRequest) {
  try {
    const { action, name, phone, role } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

    const school    = await getSchoolConfig();
    const client    = sb();
    const plainPass = defaultPassword(phone, school.auth.passwordPrefix);
    const hash      = await bcrypt.hash(plainPass, 10);

    if (action === "create") {
      // Check if account already exists
      const { data: existing } = await client
        .from("teacher_accounts").select("id, username").eq("name", name.trim()).maybeSingle();
      if (existing) {
        return NextResponse.json({ error: `Login already exists (username: ${existing.username})` }, { status: 400 });
      }

      // Unique username
      const base = generateUsername(name);
      let username = base;
      let attempt  = 1;
      while (true) {
        const { data } = await client.from("teacher_accounts").select("id").eq("username", username).maybeSingle();
        if (!data) break;
        attempt++;
        username = `${base}${attempt}`;
      }

      const { error } = await client.from("teacher_accounts").insert({
        username, name: name.trim(), password_hash: hash, role: role || "Teacher", status: "active",
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      const { msg: createMsg, waUrl: createFallback } = buildWaMsg(phone, name, username, plainPass, school.name, school.domain);
      const createSent = phone ? await sendWhatsApp(phone, createMsg) : false;
      return NextResponse.json({
        success: true, username, password: plainPass, sent: createSent,
        waUrl: createSent ? null : createFallback,
      });
    }

    if (action === "reset") {
      const { data: account } = await client
        .from("teacher_accounts").select("id, username").eq("name", name.trim()).maybeSingle();
      if (!account) return NextResponse.json({ error: "No login account found for this staff member" }, { status: 404 });

      await client.from("teacher_accounts").update({ password_hash: hash }).eq("id", account.id);

      const { msg: resetMsg, waUrl: resetFallback } = buildWaMsg(phone, name, account.username, plainPass, school.name, school.domain);
      const resetSent = phone ? await sendWhatsApp(phone, resetMsg) : false;
      return NextResponse.json({
        success: true, username: account.username, password: plainPass, sent: resetSent,
        waUrl: resetSent ? null : resetFallback,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET — fetch all teacher_accounts (username + name)
export async function GET() {
  try {
    const { data, error } = await sb()
      .from("teacher_accounts")
      .select("id, username, name, status")
      .order("name");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ accounts: data || [] });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
