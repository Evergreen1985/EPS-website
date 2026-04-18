import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

export async function GET() {
  const { data, error } = await sb().from("sections").select("*").order("program_id").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sections: data });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { data, error } = await sb().from("sections").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function PATCH(req: Request) {
  const { id, ...updates } = await req.json();
  const { data, error } = await sb().from("sections").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  const { error } = await sb().from("sections").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
