import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function sb() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, key);
}

// GET /api/transport/cleanup-settings
export async function GET() {
  const { data } = await sb()
    .from("transport_settings")
    .select("setting_value")
    .eq("setting_key", "cleanup_paused")
    .single();

  return NextResponse.json({ paused: data?.setting_value === "true" });
}

// POST /api/transport/cleanup-settings  { paused: boolean }
export async function POST(req: NextRequest) {
  const { paused } = await req.json();

  const { error } = await sb()
    .from("transport_settings")
    .upsert(
      { setting_key: "cleanup_paused", setting_value: paused ? "true" : "false", updated_at: new Date().toISOString() },
      { onConflict: "setting_key" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, paused });
}
