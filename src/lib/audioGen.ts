// Shared on-demand audio-overview generator.
// Lifted from /api/audio/generate-all so existing routes stay untouched.
// Pipeline: Claude (translate + script) -> Gemini TTS (PCM) -> WAV -> Supabase Storage.
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export const SUPPORTED_LANGS = ["en", "te", "hi", "ta", "kn", "ml"] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

export function normalizeLang(input?: string): Lang {
  const base = (input || "en").toLowerCase().split(/[-_]/)[0];
  return (SUPPORTED_LANGS as readonly string[]).includes(base) ? (base as Lang) : "en";
}

export function getSb() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
  return createClient(url, key);
}

const LANG_CONFIG: Record<string, { name: string; greeting: string; closing: string; style: string }> = {
  en: { name: "English",   greeting: "Hello Evergreen families! Here is your update.", closing: "That's all for now from Evergreen Preschool. Have a wonderful day!", style: "conversational, warm Indian English" },
  te: { name: "Telugu",    greeting: "నమస్కారం ఎవర్‌గ్రీన్ కుటుంబాలకు! మీ అప్‌డేట్ ఇదిగో.", closing: "ప్రస్తుతానికి ఎవర్‌గ్రీన్ ప్రీస్కూల్ నుండి ఇది మాత్రమే. మీకు అద్భుతమైన రోజు ఉండాలి!", style: "warm conversational Telugu that parents speak at home" },
  hi: { name: "Hindi",     greeting: "नमस्ते एवरग्रीन परिवारों! यह रहा आपका अपडेट।", closing: "अभी के लिए एवरग्रीन प्रीस्कूल की तरफ से बस इतना ही। आपका दिन शुभ हो!", style: "warm conversational Hindi that parents speak at home" },
  ta: { name: "Tamil",     greeting: "வணக்கம் எவர்கிரீன் குடும்பங்களே! உங்கள் புதுப்பிப்பு இதோ.", closing: "தற்போதைக்கு எவர்கிரீன் ப்ரீஸ்கூலிலிருந்து இவ்வளவுதான். இனிய நாள் வாழ்த்துகிறோம்!", style: "warm conversational Tamil that parents speak at home" },
  kn: { name: "Kannada",   greeting: "ನಮಸ್ಕಾರ ಎವರ್‌ಗ್ರೀನ್ ಕುಟುಂಬಗಳೇ! ನಿಮ್ಮ ಅಪ್‌ಡೇಟ್ ಇಲ್ಲಿದೆ.", closing: "ಸದ್ಯಕ್ಕೆ ಎವರ್‌ಗ್ರೀನ್ ಪ್ರೀಸ್ಕೂಲ್‌ನಿಂದ ಇಷ್ಟೇ. ನಿಮಗೆ ಒಳ್ಳೆಯ ದಿನ ಆಗಲಿ!", style: "warm conversational Kannada that parents speak at home" },
  ml: { name: "Malayalam", greeting: "നമസ്കാരം എവർഗ്രീൻ കുടുംബങ്ങളേ! നിങ്ങളുടെ അപ്‌ഡേറ്റ് ഇതാ.", closing: "തൽക്കാലം എവർഗ്രീൻ പ്രീസ്കൂളിൽ നിന്ന് ഇത്രമാത്രം. നിങ്ങൾക്ക് ഒരു നല്ല ദിവസം ആശംസിക്കുന്നു!", style: "warm conversational Malayalam that parents speak at home" },
};

// Indian-language BCP-47 codes for Google Cloud TTS
const LANG_BCP47: Record<Lang, string> = {
  en: "en-IN", te: "te-IN", hi: "hi-IN", ta: "ta-IN", kn: "kn-IN", ml: "ml-IN",
};

async function generateScript(title: string, content: string, lang: Lang, keepEnglish?: string): Promise<string> {
  const cfg = LANG_CONFIG[lang] || LANG_CONFIG.en;
  const keepLine = keepEnglish && keepEnglish.trim()
    ? `\n- IMPORTANT: keep these terms in English exactly, never translate or transliterate them: ${keepEnglish.trim()}.`
    : "";
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1200,
    messages: [{
      role: "user",
      content: `You are a warm, clear voice assistant for Evergreen Preschool & Daycare, Bengaluru.

Convert the following school content into a short spoken audio message for parents and grandparents.
Write the ENTIRE message in ${cfg.name}. Do not mix languages — EXCEPT for the items noted below, which must stay in English.

Guidelines:
- Start with a brief: "${cfg.greeting}"
- Write in ${cfg.style}
- Read out ONLY the information in the content, faithfully and clearly. This is a notice/homework being read aloud — NOT a podcast.
- Keep it SHORT and proportional to the content. Do NOT expand, pad, repeat, or invent any details that are not in the content. A one or two line notice should become just a short spoken message (greeting + the information + closing).
- Preserve numbers, ranges (e.g. "1 to 10"), English letters (A, B, C), and any words/proper nouns the author wrote in English EXACTLY as written — do NOT translate or transliterate them.${keepLine}
- End with a brief: "${cfg.closing}"
- Write exactly as it will be spoken — no stage directions, no [brackets], no asterisks

Title: ${title || "School Update"}

Content:
${content.trim().slice(0, 3000)}

Write only the spoken message in ${cfg.name}, nothing else.`,
    }],
  });
  return msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
}

// Google Cloud Text-to-Speech — returns base64 MP3 directly (no PCM/WAV wrapping).
async function googleTTS(text: string, lang: Lang): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY || process.env.GOOGLE_VISION_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) { console.error("[googleTTS] no API key"); return null; }
  const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text: text.slice(0, 4800) },
      // languageCode + gender lets Google pick an available voice (avoids voice-name mismatches)
      voice: { languageCode: LANG_BCP47[lang] || "en-IN", ssmlGender: "FEMALE" },
      audioConfig: { audioEncoding: "MP3", speakingRate: 0.95 },
    }),
  });
  if (!res.ok) { console.error("[googleTTS]", res.status, (await res.text()).slice(0, 200)); return null; }
  const data = await res.json();
  if (!data?.audioContent) { console.error("[googleTTS] no audioContent"); return null; }
  return { buffer: Buffer.from(data.audioContent, "base64"), mimeType: "audio/mpeg" };
}

export interface GenInput {
  title: string;
  content: string;
  sourceType: string;   // 'announcement' | 'custom' | 'document'
  sourceId: string;     // uuid — announcement id, or content-hash uuid for digests
  language: string;
  keepEnglish?: string; // comma-separated terms to keep in English (e.g. "1 to 10")
}

/**
 * Generate one audio overview (single language) and persist it.
 * Returns the ready DB row, or null on failure (row marked 'failed').
 */
export async function generateAndStore(
  sb: ReturnType<typeof getSb>,
  input: GenInput,
): Promise<any | null> {
  const lang = normalizeLang(input.language);
  const allowedSource = ["announcement", "custom", "document"].includes(input.sourceType)
    ? input.sourceType : "custom";

  const { data: record, error: insErr } = await sb
    .from("audio_overviews")
    .insert({
      title: input.title.trim().slice(0, 200),
      script: "",
      source_type: allowedSource,
      source_id: input.sourceId,
      language: lang,
      status: "generating",
    })
    .select("id").single();
  if (insErr || !record) throw new Error(`audio insert failed: ${insErr?.message}`);

  const markFailed = async () => {
    await sb.from("audio_overviews").update({ status: "failed" }).eq("id", record.id);
  };

  try {
    const script = await generateScript(input.title, input.content, lang, input.keepEnglish);
    if (!script) { await markFailed(); return null; }

    const audio = await googleTTS(script, lang);
    if (!audio) { await markFailed(); return null; }

    const fileName = `audio-${record.id}-${Date.now()}.mp3`;
    const { error: upErr } = await sb.storage
      .from("audio-overviews")
      .upload(fileName, audio.buffer, { contentType: audio.mimeType, upsert: false });
    if (upErr) { await markFailed(); return null; }

    const { data: pub } = sb.storage.from("audio-overviews").getPublicUrl(fileName);
    const durationSeconds = Math.round((script.split(/\s+/).length / 150) * 60);

    const { data: updated } = await sb
      .from("audio_overviews")
      .update({ script, audio_url: pub.publicUrl, status: "ready", duration_seconds: durationSeconds })
      .eq("id", record.id)
      .select("id, title, audio_url, duration_seconds, status, language, source_type, source_id")
      .single();
    return updated;
  } catch (e) {
    await markFailed();
    throw e;
  }
}
