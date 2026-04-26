import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

// POST: AI-analyze a photo to detect children and generate tags
export async function POST(req: Request) {
  try {
    const { photoId, photoUrl, childrenInSection } = await req.json();
    // childrenInSection: [{ id, child_name, photo_url }]

    if (!photoUrl) return NextResponse.json({ error: "photoUrl required" }, { status: 400 });

    // Fetch the photo as base64 for Claude Vision
    const imgResp = await fetch(photoUrl);
    const imgBuffer = await imgResp.arrayBuffer();
    const base64 = Buffer.from(imgBuffer).toString("base64");
    const mimeType = imgResp.headers.get("content-type") || "image/jpeg";

    // Build child name list for context
    const childNames = (childrenInSection || []).map((c: any) => c.child_name).join(", ");

    // Call Claude Vision API
    const claudeResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mimeType, data: base64 },
            },
            {
              type: "text",
              text: `This is a preschool class photo. The children in this section are: ${childNames || "unknown"}.

Analyze this image and respond ONLY with valid JSON (no markdown, no extra text):
{
  "caption": "one short sentence describing the scene",
  "activity": "what activity or event is happening",
  "detected_children_count": number,
  "mood": "happy/playful/focused/celebrating",
  "tags": ["tag1","tag2","tag3"]
}`,
            },
          ],
        }],
      }),
    });

    const claudeData = await claudeResp.json();
    const rawText = claudeData?.content?.[0]?.text || "{}";

    let aiResult: any = {};
    try {
      aiResult = JSON.parse(rawText.replace(/```json|```/g, "").trim());
    } catch {
      aiResult = { caption: "Class activity photo", tags: [] };
    }

    // Update the photo record with AI tags
    if (photoId) {
      await sb().from("section_photos").update({
        ai_caption: aiResult.caption || null,
        ai_tags:    (aiResult.tags || []).join(","),
      }).eq("id", photoId);
    }

    return NextResponse.json({ success: true, aiResult });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
