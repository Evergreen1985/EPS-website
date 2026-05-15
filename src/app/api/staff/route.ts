// src/app/api/staff/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient(url, key);
}

// Sanitise: replace empty strings with null (prevents date/number column errors)
function clean(fields: Record<string, any>) {
  const out: any = {};
  for (const [k, v] of Object.entries(fields)) {
    out[k] = (v === "" || v === undefined) ? null : v;
  }
  return out;
}

// GET /api/staff
export async function GET() {
  try {
    const { data, error } = await getSupabase()
      .from("staff").select("*").order("name");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/staff  — insert (no id) or update (with id)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...fields } = body;
    const sanitised = clean(fields);
    const sb = getSupabase();

    if (id) {
      const { data, error } = await sb.from("staff")
        .update({ ...sanitised, updated_at: new Date().toISOString() })
        .eq("id", id).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, data });
    } else {
      const { data, error } = await sb.from("staff")
        .insert(sanitised).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, data });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/staff
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const { error } = await getSupabase().from("staff").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
