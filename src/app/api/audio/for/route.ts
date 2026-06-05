import { NextRequest, NextResponse } from "next/server";
import { getSb, generateAndStore, normalizeLang } from "../../../../lib/audioGen";

// On-demand audio overview for a single item + single language.
// Cache-first: if audio for (source_type, source_id, language) already exists,
// return it; otherwise generate once, store, and return. A language is only
// ever generated when a parent actually requests it.
export const maxDuration = 60;

const STALE_GENERATING_MS = 2 * 60 * 1000; // re-generate if a 'generating' row is older than this

export async function POST(req: NextRequest) {
  try {
    const { sourceType = "custom", sourceId, title, content, language, keepEnglish } = await req.json();

    if (!sourceId)        return NextResponse.json({ error: "sourceId is required" }, { status: 400 });
    if (!title?.trim())   return NextResponse.json({ error: "title is required" }, { status: 400 });
    if (!content?.trim()) return NextResponse.json({ error: "content is required" }, { status: 400 });

    const lang = normalizeLang(language);
    const sb = getSb();

    // 1) Look for an existing audio for this exact item + language
    const { data: existing } = await sb
      .from("audio_overviews")
      .select("id, title, audio_url, duration_seconds, status, language, source_type, source_id, created_at")
      .eq("source_type", sourceType)
      .eq("source_id", sourceId)
      .eq("language", lang)
      .order("created_at", { ascending: false })
      .limit(1);

    const row = existing?.[0];

    if (row?.status === "ready" && row.audio_url) {
      return NextResponse.json({ ...row, status: "ready", cached: true });
    }

    if (row?.status === "generating") {
      const age = Date.now() - new Date(row.created_at).getTime();
      if (age < STALE_GENERATING_MS) {
        // Another request is already generating this — tell the client to wait
        return NextResponse.json({ status: "generating" });
      }
      // Stale/abandoned attempt — clear it and regenerate
      await sb.from("audio_overviews").delete().eq("id", row.id);
    } else if (row?.status === "failed") {
      await sb.from("audio_overviews").delete().eq("id", row.id);
    }

    // 2) Generate, store, return
    const result = await generateAndStore(sb, { title, content, sourceType, sourceId, language: lang, keepEnglish });
    if (!result?.audio_url) {
      return NextResponse.json({ status: "failed", error: "audio generation failed" }, { status: 502 });
    }
    return NextResponse.json({ ...result, status: "ready", cached: false });
  } catch (e: any) {
    console.error("[audio/for] error:", e?.message);
    return NextResponse.json({ status: "failed", error: e?.message || "unknown error" }, { status: 500 });
  }
}
