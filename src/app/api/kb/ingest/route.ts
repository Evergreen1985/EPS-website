import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ingestDocument } from "@/lib/rag";

function getSb() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const { title, content, target = "parent", doc_type = "other", uploaded_by = "admin" } = await req.json();

    if (!title?.trim()) return NextResponse.json({ error: "title is required" }, { status: 400 });
    if (!content?.trim()) return NextResponse.json({ error: "content is required" }, { status: 400 });

    const sb = getSb();

    // Create the document record
    const { data: doc, error: docErr } = await sb
      .from("kb_documents")
      .insert({ title: title.trim(), content: content.trim(), target, doc_type, uploaded_by, is_active: true })
      .select("id")
      .single();

    if (docErr) return NextResponse.json({ error: docErr.message }, { status: 500 });

    // Ingest and chunk
    const chunkCount = await ingestDocument(doc.id, content.trim());

    return NextResponse.json({ id: doc.id, chunks: chunkCount, title });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Re-ingest existing document (admin can trigger refresh)
export async function PUT(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const sb = getSb();
    const { data: doc, error } = await sb.from("kb_documents").select("content").eq("id", id).single();
    if (error || !doc) return NextResponse.json({ error: "document not found" }, { status: 404 });

    const chunkCount = await ingestDocument(id, doc.content);
    return NextResponse.json({ id, chunks: chunkCount });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
