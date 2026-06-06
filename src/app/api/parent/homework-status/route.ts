import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

// GET ?enquiryId=  → this child's homework_status rows
export async function GET(req: NextRequest) {
  const enquiryId = new URL(req.url).searchParams.get("enquiryId");
  if (!enquiryId) return NextResponse.json([]);
  const { data, error } = await sb().from("homework_status").select("*").eq("enquiry_id", enquiryId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST → upsert this child's status / doubt / attachments for one homework
export async function POST(req: NextRequest) {
  const { homeworkId, enquiryId, childName, status, parentDoubt, doubtFileUrl, proofFileUrl } = await req.json();
  if (!homeworkId || !enquiryId) return NextResponse.json({ error: "homeworkId and enquiryId required" }, { status: 400 });
  const patch: any = { homework_id: homeworkId, enquiry_id: enquiryId, child_name: childName, updated_at: new Date().toISOString() };
  if (status        !== undefined) patch.status         = status;
  if (parentDoubt   !== undefined) patch.parent_doubt   = parentDoubt;
  if (doubtFileUrl  !== undefined) patch.doubt_file_url  = doubtFileUrl;
  if (proofFileUrl  !== undefined) patch.proof_file_url  = proofFileUrl;
  const { data, error } = await sb()
    .from("homework_status")
    .upsert(patch, { onConflict: "homework_id,enquiry_id" })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, row: data });
}
