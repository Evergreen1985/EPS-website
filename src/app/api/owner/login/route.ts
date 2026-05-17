import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { signOwnerSession, OWNER_COOKIE_NAME, OWNER_MAX_AGE } from "@/lib/ownerSession";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

const DUMMY_HASH = "$2b$10$dummyhashfortimingatttackpreventionxxxxxxxxxxxxxxxx";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const username = String(body.username ?? "").trim().slice(0, 64);
    const password = String(body.password ?? "").slice(0, 128);

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const { data: account } = await sb()
      .from("admin_accounts")
      .select("id, username, name, role, password_hash, is_active")
      .eq("username", username)
      .maybeSingle();

    const hashToCheck = account?.password_hash ?? DUMMY_HASH;
    const passwordValid = await bcrypt.compare(password, hashToCheck);

    if (!account || !passwordValid || account.is_active === false || account.role !== "owner") {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    sb().from("admin_accounts").update({ last_login: new Date().toISOString() }).eq("id", account.id).then(() => {});

    const token = await signOwnerSession({ username: account.username, name: account.name, role: account.role });

    const res = NextResponse.json({ success: true, name: account.name });
    res.cookies.set(OWNER_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: OWNER_MAX_AGE,
    });
    return res;
  } catch (e) {
    console.error("[owner/login]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
