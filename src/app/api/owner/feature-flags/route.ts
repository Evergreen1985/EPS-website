import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

// GET /api/owner/feature-flags?key=test_runner
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });

  const { data, error } = await sb().from("app_feature_flags").select("enabled").eq("key", key).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ enabled: data?.enabled ?? false });
}

// POST /api/owner/feature-flags — toggle a flag
export async function POST(req: Request) {
  const { key, enabled } = await req.json();
  if (!key || enabled === undefined) return NextResponse.json({ error: "Missing key or enabled" }, { status: 400 });

  const { error } = await sb().from("app_feature_flags").upsert(
    { key, enabled, updated_at: new Date().toISOString(), updated_by: "owner" },
    { onConflict: "key" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, enabled });
}
