import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function sb() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const channel_id = searchParams.get("channel_id");
  const before     = searchParams.get("before");

  if (!channel_id) return NextResponse.json({ error: "channel_id required" }, { status: 400 });

  let query = sb()
    .from("community_messages")
    .select("*, reactions:message_reactions(emoji, member_id)")
    .eq("channel_id", channel_id)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(50);

  if (before) query = query.lt("created_at", before);

  const { data: messages, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const processed = (messages || []).reverse().map((msg: any) => {
    const reactionMap: Record<string, number> = {};
    (msg.reactions || []).forEach((r: any) => {
      reactionMap[r.emoji] = (reactionMap[r.emoji] || 0) + 1;
    });
    return { ...msg, reactions: reactionMap };
  });

  return NextResponse.json({ messages: processed });
}

export async function POST(req: NextRequest) {
  const { channel_id, member_id, display_name, user_type, avatar_emoji, content, msg_type, image_url } = await req.json();

  if (!channel_id || !member_id || !display_name)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  if (!content && !image_url)
    return NextResponse.json({ error: "content or image_url required" }, { status: 400 });

  const { data, error } = await sb()
    .from("community_messages")
    .insert({
      channel_id, member_id, display_name,
      user_type:   user_type   || "community",
      avatar_emoji: avatar_emoji || "😊",
      content:     content   || null,
      msg_type:    msg_type  || "text",
      image_url:   image_url || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: data });
}
