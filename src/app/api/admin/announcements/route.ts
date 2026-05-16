import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

export async function GET() {
  const { data, error } = await sb()
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  const { title, body, target = "all", priority = "normal" } = await req.json();
  if (!title?.trim() || !body?.trim())
    return NextResponse.json({ error: "Title and body are required" }, { status: 400 });

  const { data, error } = await sb()
    .from("announcements")
    .insert({ title: title.trim(), body: body.trim(), target, priority })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const { id, title, body, target, priority } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  const updates: any = {};
  if (title !== undefined) updates.title = title;
  if (body  !== undefined) updates.body  = body;
  if (target !== undefined) updates.target = target;
  if (priority !== undefined) updates.priority = priority;

  const { data, error } = await sb()
    .from("announcements")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  const { error } = await sb().from("announcements").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
