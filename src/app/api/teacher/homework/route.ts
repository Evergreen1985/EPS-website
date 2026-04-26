import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sectionId, sectionName, title, description, dueDate, subject, assignedBy } = body;
    if (!sectionId || !title || !dueDate) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const { data, error } = await sb()
      .from("homework")
      .insert({ section_id: sectionId, section_name: sectionName, title, description, due_date: dueDate, subject, assigned_by: assignedBy })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  const { error } = await sb().from("homework").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
