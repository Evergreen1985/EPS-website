import { NextResponse } from "next/server";

// TEMP diagnostic — reports presence/length of keys (NOT their values). Remove after.
export async function GET() {
  const g = (k: string) => { const v = process.env[k] || ""; return { set: !!v, len: v.length }; };
  return NextResponse.json({
    GOOGLE_TTS_API_KEY:    g("GOOGLE_TTS_API_KEY"),
    GOOGLE_VISION_API_KEY: g("GOOGLE_VISION_API_KEY"),
    GOOGLE_MAPS_API_KEY:   g("GOOGLE_MAPS_API_KEY"),
    ANTHROPIC_API_KEY:     g("ANTHROPIC_API_KEY"),
  });
}
