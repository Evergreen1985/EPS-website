import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

export async function GET() {
  const { data, error } = await sb()
    .from("programmes")
    .select("*")
    .order("sort_order")
    .order("label");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ programmes: data || [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { slug, label, icon, color, sort_order } = body;
  if (!slug || !label) {
    return NextResponse.json({ error: "slug and label are required" }, { status: 400 });
  }
  const { data, error } = await sb()
    .from("programmes")
    .insert({ slug: slug.trim().toLowerCase(), label: label.trim(), icon: icon || "🎓", color: color || "#178F78", sort_order: sort_order || 0 })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function PATCH(req: NextRequest) {
  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (updates.slug) updates.slug = updates.slug.trim().toLowerCase();
  if (updates.label) updates.label = updates.label.trim();
  const { data, error } = await sb()
    .from("programmes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { error } = await sb().from("programmes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
