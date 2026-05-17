import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { ageMonths } = await req.json();
    if (typeof ageMonths !== "number" || ageMonths < 1) {
      return NextResponse.json({ tip: "" });
    }

    const years = Math.floor(ageMonths / 12);
    const months = ageMonths % 12;
    const ageLabel = years > 0
      ? (months > 0 ? `${years} year${years > 1 ? "s" : ""} ${months} month${months > 1 ? "s" : ""}` : `${years} year${years > 1 ? "s" : ""}`)
      : `${ageMonths} month${ageMonths > 1 ? "s" : ""}`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 120,
      messages: [{
        role: "user",
        content: `A child is ${ageLabel} old. Give parents one warm, encouraging sentence about what their child is likely developing or learning at this age, and one sentence about what to look forward to next. Keep it under 60 words, friendly and specific to this age. No bullet points, no headers — plain sentences only.`,
      }],
    });

    const tip = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    return NextResponse.json({ tip });
  } catch {
    return NextResponse.json({ tip: "" });
  }
}
