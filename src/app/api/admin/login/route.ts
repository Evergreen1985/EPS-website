import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) return NextResponse.json({ error: "Credentials required" }, { status: 400 });

    const { data, error } = await sb()
      .from("admin_accounts")
      .select("*")
      .eq("username", username.trim())
      .eq("password_hash", password)
      .maybeSingle();

    if (error || !data) return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });

    await sb().from("admin_accounts").update({ last_login: new Date().toISOString() }).eq("id", data.id);

    return NextResponse.json({ success: true, name: data.name, role: data.role, username: data.username });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
