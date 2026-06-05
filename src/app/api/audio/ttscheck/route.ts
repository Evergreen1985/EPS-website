import { NextResponse } from "next/server";

// TEMP diagnostic — probes the prod env's keys (reports status codes, not values). Remove after.
export async function GET() {
  const out: any = {};
  const len = (k: string) => (process.env[k] || "").length;
  out.keyLens = { TTS: len("GOOGLE_TTS_API_KEY"), VISION: len("GOOGLE_VISION_API_KEY"), MAPS: len("GOOGLE_MAPS_API_KEY"), ANTHROPIC: len("ANTHROPIC_API_KEY"), GEMINI: len("GEMINI_API_KEY") };
  try {
    const k = process.env.GOOGLE_TTS_API_KEY || process.env.GOOGLE_VISION_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "";
    const r = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${k}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: { text: "hi" }, voice: { languageCode: "en-IN", ssmlGender: "FEMALE" }, audioConfig: { audioEncoding: "MP3" } }),
    });
    out.ttsProbe = { status: r.status, body: (await r.text()).slice(0, 180) };
  } catch (e: any) { out.ttsProbe = { error: e.message }; }
  try {
    const ak = process.env.ANTHROPIC_API_KEY || "";
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "x-api-key": ak, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 10, messages: [{ role: "user", content: "hi" }] }),
    });
    out.claudeProbe = { status: r.status, body: (await r.text()).slice(0, 140) };
  } catch (e: any) { out.claudeProbe = { error: e.message }; }
  return NextResponse.json(out);
}
