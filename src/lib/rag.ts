import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, key);
}

export function chunkText(text: string, size = 480, overlap = 80): string[] {
  const paragraphs = text.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    if ((current + "\n\n" + trimmed).length <= size) {
      current = current ? current + "\n\n" + trimmed : trimmed;
    } else {
      if (current) chunks.push(current);
      if (trimmed.length > size) {
        // Hard-split long paragraphs
        let i = 0;
        while (i < trimmed.length) {
          chunks.push(trimmed.slice(i, i + size));
          i += size - overlap;
        }
        current = "";
      } else {
        current = trimmed;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks.filter(c => c.trim().length > 40);
}

export async function ingestDocument(documentId: string, content: string): Promise<number> {
  const sb = getSupabase();
  await sb.from("kb_chunks").delete().eq("document_id", documentId);

  const chunks = chunkText(content);
  if (chunks.length === 0) return 0;

  const rows = chunks.map((chunk, index) => ({ document_id: documentId, chunk_index: index, content: chunk }));
  const { error } = await sb.from("kb_chunks").insert(rows);
  if (error) throw new Error(error.message);
  return chunks.length;
}

export type RAGChunk = { id: string; content: string; document_id: string; document_title: string; doc_type: string; rank: number };

export async function retrieveChunks(
  query: string,
  target: "parent" | "staff" | "both" = "parent",
  topK = 5
): Promise<RAGChunk[]> {
  const sb = getSupabase();
  const { data, error } = await sb.rpc("search_kb_chunks", {
    query_text: query,
    target_filter: target,
    limit_count: topK,
  });
  if (error) throw new Error(error.message);
  return (data as RAGChunk[]) || [];
}

export async function generateRAGAnswer(
  query: string,
  chunks: RAGChunk[],
  systemPrompt: string,
  maxTokens = 512
): Promise<{ answer: string; sources: string[] }> {
  const client = new Anthropic();

  if (chunks.length === 0) {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: query }],
    });
    const answer = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
    return { answer, sources: [] };
  }

  const context = chunks
    .map((c, i) => `[Source ${i + 1} — ${c.document_title}]\n${c.content}`)
    .join("\n\n---\n\n");

  const sources = [...new Set(chunks.map(c => c.document_title))];

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: maxTokens,
    system: systemPrompt + "\n\nAlways cite sources by name when referencing them. If the answer cannot be found in the provided documents, say so clearly and briefly.",
    messages: [{
      role: "user",
      content: `Question: ${query}\n\nRelevant school documents:\n\n${context}\n\nAnswer based only on these documents.`,
    }],
  });

  const answer = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
  return { answer, sources };
}

export async function generateQuiz(
  content: string,
  topic: string,
  count = 5
): Promise<Array<{ question: string; options: string[]; correct: number; explanation: string }>> {
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `Generate ${count} multiple-choice quiz questions about "${topic}" based on this content:\n\n${content.slice(0, 3000)}\n\nReturn ONLY valid JSON array with this exact structure:\n[{"question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."}]\nThe "correct" field is the 0-based index of the right answer.`,
    }],
  });
  const text = msg.content[0].type === "text" ? msg.content[0].text : "[]";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  try { return JSON.parse(jsonMatch[0]); } catch { return []; }
}
