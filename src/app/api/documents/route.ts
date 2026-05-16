// src/app/api/documents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, key);
}

// GET /api/documents?enquiryId=xxx
// Returns all documents for a child with full history
export async function GET(req: NextRequest) {
  try {
    const enquiryId = req.nextUrl.searchParams.get("enquiryId");
    if (!enquiryId) return NextResponse.json({ error: "enquiryId required" }, { status: 400 });

    const { data, error } = await getSupabase()
      .from("child_documents")
      .select("*")
      .eq("enquiry_id", enquiryId)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/documents — save a document record after upload
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      enquiry_id, child_name, document_type, document_label,
      file_url, file_name, file_size, mime_type,
      uploaded_by, uploaded_by_name,
    } = body;

    if (!enquiry_id || !document_type || !file_url)
      return NextResponse.json({ error: "enquiry_id, document_type, file_url required" }, { status: 400 });

    const { data, error } = await getSupabase()
      .from("child_documents")
      .insert({
        enquiry_id, child_name, document_type,
        document_label: document_label || document_type,
        file_url, file_name, file_size, mime_type,
        uploaded_by: uploaded_by || "parent",
        uploaded_by_name: uploaded_by_name || "",
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/documents — verify, reject, or save OCR data
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action, verified_by, rejection_reason, ocr_data, ocr_applied } = body;

    if (!id || !action) return NextResponse.json({ error: "id and action required" }, { status: 400 });

    const sb = getSupabase();
    let updates: any = {};

    if (action === "verify") {
      updates = { status: "verified", verified_by: verified_by || "Admin", verified_at: new Date().toISOString() };
    } else if (action === "reject") {
      updates = { status: "rejected", rejection_reason: rejection_reason || "", verified_by: verified_by || "Admin", verified_at: new Date().toISOString() };
    } else if (action === "save_ocr") {
      updates = { ocr_data, ocr_applied: ocr_applied || false };
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { data, error } = await sb.from("child_documents").update(updates).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/documents/pending — all pending docs across all children (admin view)
// Handled via query param: /api/documents?status=pending


// Note: To get pending docs count for admin badge, call:
// GET /api/documents/pending
// Add this as a separate route file: src/app/api/documents/pending/route.ts
