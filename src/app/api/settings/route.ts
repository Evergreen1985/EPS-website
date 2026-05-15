// src/app/api/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  // Try server-side vars first, fall back to public vars (same pattern as other routes in this project)
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient(url, key);
}

// GET /api/settings
export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("school_settings")
      .select("*")
      .eq("id", "main")
      .single();

    if (error) {
      console.error("Settings GET error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Settings GET exception:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/settings
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await req.json();
    const { id: _id, updated_at: _u, created_at: _c, ...fields } = body;

    const { data, error } = await supabase
      .from("school_settings")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", "main")
      .select()
      .single();

    if (error) {
      console.error("Settings POST error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Settings POST exception:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
