import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { retrieveChunks } from "@/lib/rag";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { ageMonths } = await req.json();
    if (typeof ageMonths !== "number" || ageMonths < 1) {
      return NextResponse.json({ tip: "", sources: [] });
    }

    const years = Math.floor(ageMonths / 12);
    const months = ageMonths % 12;
    const ageLabel = years > 0
      ? (months > 0 ? `${years} year${years > 1 ? "s" : ""} ${months} month${months > 1 ? "s" : ""}` : `${years} year${years > 1 ? "s" : ""}`)
      : `${ageMonths} month${ageMonths > 1 ? "s" : ""}`;

    // Try RAG retrieval from KB (NCF-FS, developmental milestones docs)
    let kbContext = "";
    let sources: string[] = [];
    try {
      const chunks = await retrieveChunks(
        `developmental milestones ${ageLabel} child motor language cognitive`,
        "both",
        3
      );
      if (chunks.length > 0) {
        kbContext = "\n\nFrom school curriculum references:\n" + chunks.map(c => `[${c.document_title}]: ${c.content}`).join("\n\n");
        sources = [...new Set(chunks.map(c => c.document_title))];
      }
    } catch {
      // KB not configured — use model knowledge only
    }

    const systemPrompt = `You are a warm, knowledgeable early childhood development expert at Evergreen Preschool, Bengaluru. You follow NEP 2020 Foundational Stage principles. Give parents specific, actionable, encouraging insights about their child's development.`;

    const userContent = `A child is ${ageLabel} old. Give parents:
1. One warm, specific sentence about what their child is likely developing at this age
2. One practical tip for parents to support this development at home
Keep it under 70 words total, friendly and specific to ${ageLabel}. No bullet points, no headers — plain sentences only.${kbContext}`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    });

    const tip = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    return NextResponse.json({ tip, sources });
  } catch {
    return NextResponse.json({ tip: "", sources: [] });
  }
}
