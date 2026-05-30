import { NextRequest, NextResponse } from "next/server";
import { retrieveChunks, generateRAGAnswer } from "@/lib/rag";

const PARENT_SYSTEM = `You are Evergreen AI, the friendly knowledge assistant for Evergreen Preschool & Daycare, Electronic City, Bengaluru. You help parents by answering questions about school policies, fee structures, admissions, curriculum, timings, events, and other school-related topics. Always be warm, clear, and concise. Respond in the same language as the question (English or Kannada). Keep answers under 200 words unless the question requires more detail.`;

const STAFF_SYSTEM = `You are the Staff Training Assistant for Evergreen Preschool & Daycare, Electronic City, Bengaluru. You help teachers and staff understand SOPs, child safety protocols, NEP Foundational Stage guidelines, developmental milestones, and school procedures. Be precise and professional. Reference specific guidelines or policy sections when possible. Keep answers clear and actionable.`;

export async function POST(req: NextRequest) {
  try {
    const { query, target = "parent" } = await req.json();

    if (!query?.trim()) return NextResponse.json({ error: "query is required" }, { status: 400 });
    if (!["parent", "staff", "both"].includes(target)) {
      return NextResponse.json({ error: "target must be parent, staff, or both" }, { status: 400 });
    }

    const chunks = await retrieveChunks(query.trim(), target as "parent" | "staff" | "both", 5);
    const systemPrompt = target === "staff" ? STAFF_SYSTEM : PARENT_SYSTEM;
    const { answer, sources } = await generateRAGAnswer(query.trim(), chunks, systemPrompt, 600);

    return NextResponse.json({ answer, sources, chunkCount: chunks.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
