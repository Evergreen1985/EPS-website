import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSb() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  try {
    const lang = req.nextUrl.searchParams.get("lang");
    const sb = getSb();

    let query = sb
      .from("audio_overviews")
      .select("id, title, audio_url, status, duration_seconds, source_type, language, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (lang) query = (query as any).eq("language", lang);

    const { data, error } = await query;

    // Graceful fallback if language column doesn't exist yet in DB
    if (error?.message?.includes("language")) {
      const { data: fallback, error: fallbackErr } = await sb
        .from("audio_overviews")
        .select("id, title, audio_url, status, duration_seconds, source_type, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (fallbackErr) return NextResponse.json({ error: fallbackErr.message }, { status: 500 });
      return NextResponse.json(fallback || []);
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const sb = getSb();
    const { data: record } = await sb.from("audio_overviews").select("audio_url").eq("id", id).single();

    if (record?.audio_url) {
      const parts = record.audio_url.split("/audio-overviews/");
      if (parts[1]) {
        await sb.storage.from("audio-overviews").remove([parts[1]]);
      }
    }

    const { error } = await sb.from("audio_overviews").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
