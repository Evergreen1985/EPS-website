import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { signSession, COOKIE_NAME, MAX_AGE_SECONDS } from "@/lib/adminSession";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

// A dummy hash used when the username is not found.
// Running bcrypt.compare against it prevents timing attacks that reveal
// whether a username exists in the database.
const DUMMY_HASH =
  "$2b$10$dummyhashfortimingatttackpreventionxxxxxxxxxxxxxxxx";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // Sanitise inputs — reject if missing or clearly invalid
    const username = String(body.username ?? "").trim().slice(0, 64);
    const password = String(body.password ?? "").slice(0, 128);

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Fetch the account row by username ONLY — never include the password
    // in a WHERE clause (avoids leaking timing info about hash comparison).
    const { data: account } = await sb()
      .from("admin_accounts")
      .select("id, username, name, role, password_hash, is_active")
      .eq("username", username)
      .maybeSingle();

    // Always run bcrypt even when the account doesn't exist.
    // This ensures the response time is the same whether the username is valid
    // or not, preventing username enumeration via timing.
    const hashToCheck = account?.password_hash ?? DUMMY_HASH;
    const passwordValid = await bcrypt.compare(password, hashToCheck);

    if (!account || !passwordValid || account.is_active === false) {
      // Single generic message — never say which field was wrong
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Record the login timestamp (fire-and-forget — don't await)
    sb()
      .from("admin_accounts")
      .update({ last_login: new Date().toISOString() })
      .eq("id", account.id)
      .then(() => {});

    // Create signed session token
    const token = await signSession({
      username: account.username,
      name: account.name,
      role: account.role,
    });

    // Return only non-sensitive display info in the JSON body.
    // The real session lives in the httpOnly cookie — JS cannot read it.
    const res = NextResponse.json({
      success: true,
      name: account.name,
      role: account.role,
    });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,                                      // JS cannot access
      secure: process.env.NODE_ENV === "production",      // HTTPS only in prod
      sameSite: "strict",                                  // no cross-site requests
      path: "/",
      maxAge: MAX_AGE_SECONDS,
    });

    return res;
  } catch (e: unknown) {
    console.error("[admin/login]", e);
    // Don't leak internal error details
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
