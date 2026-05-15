// src/app/api/ocr/route.ts
// Uses Claude Vision API to extract child/parent details from uploaded documents
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { base64, mediaType } = body; // base64 image from frontend

    if (!base64 || !mediaType)
      return NextResponse.json({ error: "base64 and mediaType required" }, { status: 400 });

    const response = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: `You are a document OCR assistant for an Indian preschool.
Extract the following fields from this document (Aadhaar card, birth certificate, or any ID document).
Return ONLY a valid JSON object with these exact keys. Use null for fields not found.

{
  "child_name": "full name of the child",
  "child_dob": "date in YYYY-MM-DD format",
  "father_name": "father's full name",
  "mother_name": "mother's full name",
  "address": "full residential address",
  "aadhaar_number": "12-digit number (mask last 8 digits as XXXX-XXXX-XXXX)",
  "gender": "Male or Female or null",
  "blood_group": "blood group if visible or null",
  "document_type": "Aadhaar / Birth Certificate / Passport / Other"
}

Rules:
- Return ONLY the JSON object, no explanation, no markdown backticks.
- For Aadhaar cards: the child is the main person on the card.
- For birth certificates: extract child name and parents from the certificate.
- Format dates as YYYY-MM-DD. If only year is visible, use YYYY-01-01.
- Aadhaar numbers must be masked: show only first 4 digits, rest as XXXX.`,
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    // Strip any accidental markdown
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return NextResponse.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error("OCR error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
