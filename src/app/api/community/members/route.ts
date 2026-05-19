import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function sb() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const channel_id = searchParams.get("channel_id");
  const user_type  = searchParams.get("user_type");
  const user_ref   = searchParams.get("user_ref");

  if (!channel_id || !user_type || !user_ref)
    return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const { data } = await sb()
    .from("channel_members")
    .select("*")
    .eq("channel_id", channel_id)
    .eq("user_type", user_type)
    .eq("user_ref", user_ref)
    .single();

  return NextResponse.json({ member: data || null });
}

export async function POST(req: NextRequest) {
  const { channel_id, user_type, user_ref, display_name, avatar_emoji } = await req.json();

  if (!channel_id || !user_type || !user_ref || !display_name)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const { data, error } = await sb()
    .from("channel_members")
    .upsert(
      { channel_id, user_type, user_ref, display_name, avatar_emoji: avatar_emoji || "😊" },
      { onConflict: "channel_id,user_type,user_ref" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ member: data });
}
