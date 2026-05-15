// src/app/api/ocr/route.ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { base64, mediaType } = body;

    if (!base64 || !mediaType)
      return NextResponse.json({ error: "base64 and mediaType required" }, { status: 400 });

    // PDF — send natively as document type (Claude supports PDFs directly)
    if (mediaType === "application/pdf") {
      const response = await anthropic.messages.create({
        model: "claude-opus-4-5-20251101",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: [
            {
              type: "document" as any,
              source: { type: "base64", media_type: "application/pdf", data: base64 },
            },
            { type: "text", text: getPrompt() },
          ],
        }],
      });
      const text  = response.content[0].type === "text" ? response.content[0].text.trim() : "";
      const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      return NextResponse.json({ success: true, data: JSON.parse(clean) });
    }

    // Image (JPG, PNG, WebP, GIF)
    const supported: Record<string, "image/jpeg" | "image/png" | "image/gif" | "image/webp"> = {
      "image/jpeg": "image/jpeg",
      "image/jpg":  "image/jpeg",
      "image/png":  "image/png",
      "image/gif":  "image/gif",
      "image/webp": "image/webp",
    };
    const imageMediaType = supported[mediaType] || "image/jpeg";

    const response = await anthropic.messages.create({
      model: "claude-opus-4-5-20251101",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: imageMediaType, data: base64 },
          },
          { type: "text", text: getPrompt() },
        ],
      }],
    });

    const text  = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    return NextResponse.json({ success: true, data: JSON.parse(clean) });

  } catch (err: any) {
    console.error("OCR error:", err);
    return NextResponse.json({ error: err.message || "OCR failed" }, { status: 500 });
  }
}

function getPrompt(): string {
  return `You are a document OCR assistant for an Indian preschool.
Extract the following fields from this document (Aadhaar card, birth certificate, or any ID).
Return ONLY a valid JSON object with these exact keys. Use null for any field not found.

{
  "child_name": "full name of the child",
  "child_dob": "date in YYYY-MM-DD format, null if not found",
  "father_name": "father full name or null",
  "mother_name": "mother full name or null",
  "address": "full residential address or null",
  "gender": "Male or Female or null",
  "blood_group": "blood group if visible or null",
  "document_type": "Aadhaar / Birth Certificate / Passport / Other"
}

Rules:
- Return ONLY the JSON. No explanation. No markdown. No backticks.
- Dates must be YYYY-MM-DD. If only year visible use YYYY-01-01.
- For Aadhaar: the child is the main cardholder.
- For birth certificates: extract child and parent names from the text.`;
}
