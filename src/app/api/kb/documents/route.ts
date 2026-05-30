import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSb() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  try {
    const sb = getSb();
    const target = req.nextUrl.searchParams.get("target");

    let query = sb
      .from("kb_documents")
      .select("id, title, target, doc_type, is_active, file_name, uploaded_by, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (target) query = query.eq("target", target);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Get chunk counts per document
    const ids = (data || []).map((d: any) => d.id);
    let chunkCounts: Record<string, number> = {};
    if (ids.length > 0) {
      const { data: chunks } = await sb
        .from("kb_chunks")
        .select("document_id")
        .in("document_id", ids);
      (chunks || []).forEach((c: any) => {
        chunkCounts[c.document_id] = (chunkCounts[c.document_id] || 0) + 1;
      });
    }

    const result = (data || []).map((d: any) => ({ ...d, chunk_count: chunkCounts[d.id] || 0 }));
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const sb = getSb();
    const { error } = await sb
      .from("kb_documents")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const sb = getSb();
    const { error } = await sb.from("kb_documents").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
