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
      .from("teacher_accounts")
      .select("*")
      .eq("username", username.trim().toLowerCase())
      .eq("password_hash", password)
      .eq("status", "active")
      .maybeSingle();

    if (error || !data) return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });

    await sb().from("teacher_accounts").update({ last_login: new Date().toISOString() }).eq("id", data.id);

    return NextResponse.json({
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
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
