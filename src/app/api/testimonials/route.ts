import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

// GET /api/testimonials               — all (admin)
// GET /api/testimonials?published=true — published only (public)
// GET /api/testimonials?featured=true  — featured only (homepage)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const published = searchParams.get("published");
  const featured  = searchParams.get("featured");

  let query = sb().from("testimonials").select("*").order("created_at", { ascending: false });
  if (published === "true") query = query.eq("is_published", true);
  if (featured  === "true") query = query.eq("is_featured",  true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to fetch testimonials" }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST /api/testimonials — create
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { parentName, childName, program, content, rating, avatarUrl, isPublished, isFeatured, source } = body;
  if (!parentName || !content) return NextResponse.json({ error: "parentName and content required" }, { status: 400 });

  const { data, error } = await sb().from("testimonials").insert({
    parent_name:  parentName,
    child_name:   childName || "",
    program:      program || "",
    content,
    rating:       rating || 5,
    avatar_url:   avatarUrl || "",
    is_published: isPublished || false,
    is_featured:  isFeatured  || false,
    source:       source || "direct",
  }).select().single();

  if (error) return NextResponse.json({ error: "Failed to create testimonial" }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// PATCH /api/testimonials — update
export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updates: Record<string, any> = {};
  if (fields.parentName  !== undefined) updates.parent_name  = fields.parentName;
  if (fields.childName   !== undefined) updates.child_name   = fields.childName;
  if (fields.program     !== undefined) updates.program      = fields.program;
  if (fields.content     !== undefined) updates.content      = fields.content;
  if (fields.rating      !== undefined) updates.rating       = fields.rating;
  if (fields.isPublished !== undefined) updates.is_published = fields.isPublished;
  if (fields.isFeatured  !== undefined) updates.is_featured  = fields.isFeatured;
  if (fields.source      !== undefined) updates.source       = fields.source;

  const { data, error } = await sb().from("testimonials").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// DELETE /api/testimonials?id=xxx
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { error } = await sb().from("testimonials").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  return NextResponse.json({ success: true });
}
