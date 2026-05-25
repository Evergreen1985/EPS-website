import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const LANG_CONFIG: Record<string, { name: string; greeting: string; closing: string; style: string }> = {
  en: { name: "English",   greeting: "Hello Evergreen families! Welcome to your school update.", closing: "That's all for today from Evergreen Preschool. Have a wonderful day!", style: "conversational, warm Indian English" },
  te: { name: "Telugu",    greeting: "నమస్కారం ఎవర్‌గ్రీన్ కుటుంబాలకు! మీ పాఠశాల అప్‌డేట్‌కు స్వాగతం.", closing: "ఈరోజుకు ఇది మాత్రమే ఎవర్‌గ్రీన్ ప్రీస్కూల్ నుండి. మీకు అద్భుతమైన రోజు ఉండాలని ఆశిస్తున్నాం!", style: "warm conversational Telugu that parents speak at home" },
  hi: { name: "Hindi",     greeting: "नमस्ते एवरग्रीन परिवारों! आपके स्कूल अपडेट में आपका स्वागत है।", closing: "आज के लिए बस इतना ही एवरग्रीन प्रीस्कूल की तरफ से। आपका दिन शुभ हो!", style: "warm conversational Hindi that parents speak at home" },
  ta: { name: "Tamil",     greeting: "வணக்கம் எவர்கிரீன் குடும்பங்களே! உங்கள் பள்ளி புதுப்பிப்புக்கு வரவேற்கிறோம்.", closing: "இன்றைக்கு எவர்கிரீன் ப்ரீஸ்கூலிலிருந்து இவ்வளவுதான். இனிய நாள் வாழ்த்துகிறோம்!", style: "warm conversational Tamil that parents speak at home" },
  kn: { name: "Kannada",   greeting: "ನಮಸ್ಕಾರ ಎವರ್‌ಗ್ರೀನ್ ಕುಟುಂಬಗಳೇ! ನಿಮ್ಮ ಶಾಲಾ ಅಪ್‌ಡೇಟ್‌ಗೆ ಸ್ವಾಗತ.", closing: "ಇಂದಿಗೆ ಎವರ್‌ಗ್ರೀನ್ ಪ್ರೀಸ್ಕೂಲ್‌ನಿಂದ ಇಷ್ಟೇ. ನಿಮಗೆ ಒಳ್ಳೆಯ ದಿನ ಆಗಲಿ!", style: "warm conversational Kannada that parents speak at home" },
  ml: { name: "Malayalam", greeting: "നമസ്കാരം എവർഗ്രീൻ കുടുംബങ്ങളേ! നിങ്ങളുടെ സ്കൂൾ അപ്‌ഡേറ്റിലേക്ക് സ്വാഗതം.", closing: "ഇന്നത്തേക്ക് എവർഗ്രീൻ പ്രീസ്കൂളിൽ നിന്ന് ഇത്രമാത്രം. നിങ്ങൾക്ക് ഒരു നല്ല ദിവസം ആശംസിക്കുന്നു!", style: "warm conversational Malayalam that parents speak at home" },
};

export async function POST(req: NextRequest) {
  try {
    const { title, content, lang = "en" } = await req.json();
    if (!content?.trim()) return NextResponse.json({ error: "content is required" }, { status: 400 });

    const cfg = LANG_CONFIG[lang] || LANG_CONFIG.en;

    const msg = await client.messages.create({
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

    const script = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
    if (!script) return NextResponse.json({ error: "Failed to generate script" }, { status: 500 });

    return NextResponse.json({ script });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
