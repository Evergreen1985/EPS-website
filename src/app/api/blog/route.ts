import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// GET /api/blog              — all posts (admin)
// GET /api/blog?published=true — published only (public)
// GET /api/blog?slug=xxx      — single post by slug
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const published = searchParams.get("published");
  const slug      = searchParams.get("slug");
  const category  = searchParams.get("category");

  if (slug) {
    const { data, error } = await sb().from("blog_posts").select("*").eq("slug", slug).maybeSingle();
    if (error) return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
    return NextResponse.json(data || null);
  }

  let query = sb().from("blog_posts").select("*").order("created_at", { ascending: false });
  if (published === "true") { query = query.eq("is_published", true); }
  if (category)             { query = query.eq("category", category); }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST /api/blog — create post
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { title, excerpt, content, category, coverImageUrl, author, isPublished } = body;
  if (!title || !content) return NextResponse.json({ error: "title and content required" }, { status: 400 });

  const slug = slugify(title) + "-" + Date.now().toString(36);
  const now  = new Date().toISOString();

  const { data, error } = await sb().from("blog_posts").insert({
    title, slug, excerpt: excerpt || "", content, category: category || "news",
    cover_image_url: coverImageUrl || "", author: author || "Evergreen Team",
    is_published: isPublished || false,
    published_at: isPublished ? now : null,
    updated_at: now,
  }).select().single();

  if (error) return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// PATCH /api/blog — update post
export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (fields.title          !== undefined) updates.title           = fields.title;
  if (fields.excerpt        !== undefined) updates.excerpt         = fields.excerpt;
  if (fields.content        !== undefined) updates.content         = fields.content;
  if (fields.category       !== undefined) updates.category        = fields.category;
  if (fields.coverImageUrl  !== undefined) updates.cover_image_url = fields.coverImageUrl;
  if (fields.author         !== undefined) updates.author          = fields.author;
  if (fields.isPublished    !== undefined) {
    updates.is_published = fields.isPublished;
    if (fields.isPublished) updates.published_at = new Date().toISOString();
  }

  const { data, error } = await sb().from("blog_posts").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// DELETE /api/blog?id=xxx
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { error } = await sb().from("blog_posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  return NextResponse.json({ success: true });
}
