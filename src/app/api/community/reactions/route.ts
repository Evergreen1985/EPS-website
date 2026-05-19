import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function sb() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
}

export async function POST(req: NextRequest) {
  const { message_id, member_id, emoji } = await req.json();

  if (!message_id || !member_id || !emoji)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const { data: existing } = await sb()
    .from("message_reactions")
    .select("id")
    .eq("message_id", message_id)
    .eq("member_id", member_id)
    .eq("emoji", emoji)
    .single();

  if (existing) {
    await sb().from("message_reactions").delete().eq("id", existing.id);
    return NextResponse.json({ action: "removed" });
  }

  await sb().from("message_reactions").insert({ message_id, member_id, emoji });
  return NextResponse.json({ action: "added" });
}
