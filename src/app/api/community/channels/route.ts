import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function sb() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
}

export async function GET() {
  const { data: channels, error } = await sb()
    .from("community_channels")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = (channels || []).map((c: any) => c.id);
  const { data: counts } = await sb()
    .from("community_messages")
    .select("channel_id")
    .in("channel_id", ids)
    .eq("is_deleted", false);

  const countMap: Record<string, number> = {};
  (counts || []).forEach((r: any) => { countMap[r.channel_id] = (countMap[r.channel_id] || 0) + 1; });

  return NextResponse.json({
    channels: (channels || []).map((c: any) => ({ ...c, message_count: countMap[c.id] || 0 })),
  });
}
