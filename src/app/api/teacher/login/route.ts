import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { signTeacherSession, TEACHER_COOKIE_NAME, TEACHER_MAX_AGE } from "@/lib/teacherSession";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

// Dummy hash prevents timing attacks when username is not found
const DUMMY_HASH = "$2b$10$dummyhashfortimingattackpreventionxxxxxxxxxxxxxxxx";

export async function POST(req: Request) {
  try {
    // Rate limit: 10 attempts per IP per 15 minutes
    const ip = getClientIp(req);
    if (!rateLimit(`teacher-login:${ip}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 });
    }

    const { username, password } = await req.json().catch(() => ({}));
    if (!username || !password) {
      return NextResponse.json({ error: "Credentials required" }, { status: 400 });
    }

    const usernameClean = String(username).trim().toLowerCase().slice(0, 64);
    const passwordClean = String(password).slice(0, 128);

    // Fetch by username only — never filter by password in the DB query
    const { data, error } = await sb()
      .from("teacher_accounts")
      .select("id, username, name, password_hash, section_id, section_name, program_id, program_label, role, status")
      .eq("username", usernameClean)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const hashToCheck = data?.password_hash ?? DUMMY_HASH;

    // Try bcrypt first (properly hashed passwords)
    let passwordValid = await bcrypt.compare(passwordClean, hashToCheck).catch(() => false);

    // Backward compat: if bcrypt fails, check plaintext (accounts not yet migrated)
    // On match, immediately rehash and update the stored value
    if (!passwordValid && data && data.password_hash === passwordClean) {
      passwordValid = true;
      const newHash = await bcrypt.hash(passwordClean, 10);
      await sb().from("teacher_accounts").update({ password_hash: newHash }).eq("id", data.id);
    }

    if (!data || !passwordValid) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // Update last login (fire-and-forget)
    sb().from("teacher_accounts").update({ last_login: new Date().toISOString() }).eq("id", data.id).then(() => {});

    const token = await signTeacherSession({
      id:           data.id,
      username:     data.username,
      name:         data.name,
      sectionId:    data.section_id    || "",
      sectionName:  data.section_name  || "",
      programId:    data.program_id    || "",
      programLabel: data.program_label || "",
      role:         data.role          || "teacher",
    });

    const res = NextResponse.json({
      success:      true,
      id:           data.id,
      name:         data.name,
      username:     data.username,
      sectionId:    data.section_id,
      sectionName:  data.section_name,
      programId:    data.program_id,
      programLabel: data.program_label,
      role:         data.role,
    });
    res.cookies.set(TEACHER_COOKIE_NAME, token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", maxAge: TEACHER_MAX_AGE, path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
