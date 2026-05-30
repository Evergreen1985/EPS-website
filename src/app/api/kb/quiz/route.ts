import { NextRequest, NextResponse } from "next/server";
import { retrieveChunks, generateQuiz } from "@/lib/rag";

export async function POST(req: NextRequest) {
  try {
    const { topic, count = 5, target = "staff" } = await req.json();
    if (!topic?.trim()) return NextResponse.json({ error: "topic is required" }, { status: 400 });

    // Retrieve relevant content for the topic
    const chunks = await retrieveChunks(topic.trim(), target as "parent" | "staff" | "both", 8);

    let content = chunks.map(c => c.content).join("\n\n");
    if (!content.trim()) {
      content = `Generate general knowledge questions about: ${topic}`;
    }

    const questions = await generateQuiz(content, topic.trim(), Math.min(count, 10));

    if (questions.length === 0) {
      return NextResponse.json({ error: "Could not generate quiz. Try a more specific topic." }, { status: 422 });
    }

    const sources = [...new Set(chunks.map(c => c.document_title))];
    return NextResponse.json({ questions, topic: topic.trim(), sources });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
