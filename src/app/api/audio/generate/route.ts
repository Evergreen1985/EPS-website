import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSb() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
  return createClient(url, key);
}

function pcmToWav(pcm: Buffer, sampleRate: number, channels: number, bitsPerSample: number): Buffer {
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE((sampleRate * channels * bitsPerSample) / 8, 28);
  header.writeUInt16LE((channels * bitsPerSample) / 8, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcm]);
}

async function geminiTTS(text: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[audio/generate] GEMINI_API_KEY not set");
    return null;
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: text.slice(0, 5000) }], role: "user" }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } },
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("[audio/generate] Gemini TTS error:", res.status, err);
    return null;
  }

  const data = await res.json();
  const inlineData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  if (!inlineData?.data) {
    console.error("[audio/generate] Gemini TTS: no audio data in response");
    return null;
  }

  // Gemini returns L16 PCM at 24000 Hz mono — wrap in WAV header for browser playback
  const pcm = Buffer.from(inlineData.data, "base64");
  const wav = pcmToWav(pcm, 24000, 1, 16);
  return { buffer: wav, mimeType: "audio/wav" };
}

export async function POST(req: NextRequest) {
  try {
    const { title, script, source_type = "custom", source_id, language = "en" } = await req.json();
    if (!script?.trim()) return NextResponse.json({ error: "script is required" }, { status: 400 });
    if (!title?.trim())  return NextResponse.json({ error: "title is required" }, { status: 400 });

    const sb = getSb();

    const { data: record, error: insertErr } = await sb
      .from("audio_overviews")
      .insert({ title: title.trim(), script: script.trim(), source_type, source_id, language, status: "generating" })
      .select("id")
      .single();

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    const audio = await geminiTTS(script.trim());

    if (audio) {
      const fileName = `audio-${record.id}-${Date.now()}.wav`;
      const { error: uploadErr } = await sb.storage
        .from("audio-overviews")
        .upload(fileName, audio.buffer, { contentType: audio.mimeType, upsert: false });

      if (!uploadErr) {
        const { data: publicUrl } = sb.storage.from("audio-overviews").getPublicUrl(fileName);
        const wordCount = script.trim().split(/\s+/).length;
        const durationSeconds = Math.round((wordCount / 150) * 60);

        await sb.from("audio_overviews").update({
          audio_url: publicUrl.publicUrl,
          status: "ready",
          duration_seconds: durationSeconds,
          updated_at: new Date().toISOString(),
        }).eq("id", record.id);

        return NextResponse.json({
          id: record.id,
          audio_url: publicUrl.publicUrl,
          status: "ready",
          duration_seconds: durationSeconds,
        });
      } else {
        console.error("[audio/generate] Storage upload error:", uploadErr.message);
      }
    }

    await sb.from("audio_overviews").update({
      status: "failed",
      updated_at: new Date().toISOString(),
    }).eq("id", record.id);

    return NextResponse.json({
      id: record.id,
      status: "failed",
      message: "Audio generation failed. Check server logs for details.",
    }, { status: 500 });

  } catch (e: any) {
    console.error("[audio/generate] Unexpected error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
