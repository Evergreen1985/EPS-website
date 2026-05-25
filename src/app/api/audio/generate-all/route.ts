import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

function getSb() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
  return createClient(url, key);
}

const LANG_CONFIG: Record<string, { name: string; greeting: string; closing: string; style: string }> = {
  en: { name: "English",   greeting: "Hello Evergreen families! Welcome to your school update.", closing: "That's all for today from Evergreen Preschool. Have a wonderful day!", style: "conversational, warm Indian English" },
  te: { name: "Telugu",    greeting: "నమస్కారం ఎవర్‌గ్రీన్ కుటుంబాలకు! మీ పాఠశాల అప్‌డేట్‌కు స్వాగతం.", closing: "ఈరోజుకు ఇది మాత్రమే ఎవర్‌గ్రీన్ ప్రీస్కూల్ నుండి. మీకు అద్భుతమైన రోజు ఉండాలని ఆశిస్తున్నాం!", style: "warm conversational Telugu that parents speak at home" },
  hi: { name: "Hindi",     greeting: "नमस्ते एवरग्रीन परिवारों! आपके स्कूल अपडेट में आपका स्वागत है।", closing: "आज के लिए बस इतना ही एवरग्रीन प्रीस्कूल की तरफ से। आपका दिन शुभ हो!", style: "warm conversational Hindi that parents speak at home" },
  ta: { name: "Tamil",     greeting: "வணக்கம் எவர்கிரீன் குடும்பங்களே! உங்கள் பள்ளி புதுப்பிப்புக்கு வரவேற்கிறோம்.", closing: "இன்றைக்கு எவர்கிரீன் ப்ரீஸ்கூலிலிருந்து இவ்வளவுதான். இனிய நாள் வாழ்த்துகிறோம்!", style: "warm conversational Tamil that parents speak at home" },
  kn: { name: "Kannada",   greeting: "ನಮಸ್ಕಾರ ಎವರ್‌ಗ್ರೀನ್ ಕುಟುಂಬಗಳೇ! ನಿಮ್ಮ ಶಾಲಾ ಅಪ್‌ಡೇಟ್‌ಗೆ ಸ್ವಾಗತ.", closing: "ಇಂದಿಗೆ ಎವರ್‌ಗ್ರೀನ್ ಪ್ರೀಸ್ಕೂಲ್‌ನಿಂದ ಇಷ್ಟೇ. ನಿಮಗೆ ಒಳ್ಳೆಯ ದಿನ ಆಗಲಿ!", style: "warm conversational Kannada that parents speak at home" },
  ml: { name: "Malayalam", greeting: "നമസ്കാരം എവർഗ്രീൻ കുടുംബങ്ങളേ! നിങ്ങളുടെ സ്കൂൾ അപ്‌ഡേറ്റിലേക്ക് സ്വാഗതം.", closing: "ഇന്നത്തേക്ക് എവർഗ്രീൻ പ്രീസ്കൂളിൽ നിന്ന് ഇത്രമാത്രം. നിങ്ങൾക്ക് ഒരു നല്ല ദിവസം ആശംസിക്കുന്നു!", style: "warm conversational Malayalam that parents speak at home" },
};

const LANGUAGES = ["en", "te", "hi", "ta", "kn", "ml"] as const;

function pcmToWav(pcm: Buffer, sampleRate: number, channels: number, bitsPerSample: number): Buffer {
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0); header.writeUInt32LE(36 + dataSize, 4); header.write("WAVE", 8);
  header.write("fmt ", 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22); header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE((sampleRate * channels * bitsPerSample) / 8, 28);
  header.writeUInt16LE((channels * bitsPerSample) / 8, 32); header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36); header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcm]);
}

async function generateScript(title: string, content: string, lang: string): Promise<string> {
  const cfg = LANG_CONFIG[lang] || LANG_CONFIG.en;
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    messages: [{
      role: "user",
      content: `You are a warm, engaging podcast scriptwriter for Evergreen Preschool & Daycare, Bengaluru.

Convert the following school content into a 3-5 minute podcast-style audio script for parents.
Write the ENTIRE script in ${cfg.name}. Do not mix languages.

Guidelines:
- Start with: "${cfg.greeting}"
- Write in ${cfg.style}
- Break dense information into easy-to-follow spoken segments
- End with: "${cfg.closing}"
- Write exactly as it will be spoken — no stage directions, no [brackets], no asterisks
- Target 400-600 words for 3-5 minutes of audio

Title: ${title || "School Update"}

Content to convert:
${content.trim().slice(0, 3000)}

Write only the script text in ${cfg.name}, nothing else.`,
    }],
  });
  return msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
}

async function geminiTTS(text: string, voiceName = "Aoede"): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: text.slice(0, 5000) }], role: "user" }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
        },
      }),
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const inlineData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  if (!inlineData?.data) return null;
  const pcm = Buffer.from(inlineData.data, "base64");
  return { buffer: pcmToWav(pcm, 24000, 1, 16), mimeType: "audio/wav" };
}

async function generateForLanguage(
  sb: ReturnType<typeof getSb>,
  title: string,
  content: string,
  voice: string,
  lang: string,
): Promise<{ lang: string; status: string; id?: string }> {
  try {
    const script = await generateScript(title, content, lang);
    if (!script) return { lang, status: "script_failed" };

    const { data: record, error: insertErr } = await sb
      .from("audio_overviews")
      .insert({ title: title.trim(), script, source_type: "custom", language: lang, status: "generating" })
      .select("id").single();
    if (insertErr || !record) return { lang, status: "insert_failed" };

    const audio = await geminiTTS(script, voice);
    if (!audio) {
      await sb.from("audio_overviews").update({ status: "failed" }).eq("id", record.id);
      return { lang, status: "tts_failed", id: record.id };
    }

    const fileName = `audio-${record.id}-${Date.now()}.wav`;
    const { error: uploadErr } = await sb.storage
      .from("audio-overviews")
      .upload(fileName, audio.buffer, { contentType: audio.mimeType, upsert: false });

    if (uploadErr) {
      await sb.from("audio_overviews").update({ status: "failed" }).eq("id", record.id);
      return { lang, status: "upload_failed", id: record.id };
    }

    const { data: publicUrl } = sb.storage.from("audio-overviews").getPublicUrl(fileName);
    const wordCount = script.split(/\s+/).length;
    const durationSeconds = Math.round((wordCount / 150) * 60);

    await sb.from("audio_overviews").update({
      audio_url: publicUrl.publicUrl,
      status: "ready",
      duration_seconds: durationSeconds,
    }).eq("id", record.id);

    return { lang, status: "ready", id: record.id };
  } catch (e: any) {
    console.error(`[generate-all] ${lang} error:`, e.message);
    return { lang, status: "error" };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, content, voice = "Aoede" } = await req.json();
    if (!content?.trim()) return NextResponse.json({ error: "content is required" }, { status: 400 });
    if (!title?.trim())   return NextResponse.json({ error: "title is required" }, { status: 400 });

    const sb = getSb();
    const results = await Promise.all(
      LANGUAGES.map(lang => generateForLanguage(sb, title.trim(), content.trim(), voice, lang))
    );

    const succeeded = results.filter(r => r.status === "ready").length;
    return NextResponse.json({ results, succeeded, total: LANGUAGES.length });
  } catch (e: any) {
    console.error("[generate-all] Unexpected error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
