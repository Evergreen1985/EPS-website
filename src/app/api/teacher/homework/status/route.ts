import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

// GET ?homeworkIds=id1,id2  → all per-child status/doubt rows for those homeworks
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ids = (searchParams.get("homeworkIds") || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!ids.length) return NextResponse.json([]);
  const { data, error } = await sb().from("homework_status").select("*").in("homework_id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// PATCH { id, reply }  → teacher replies to a parent's doubt
export async function PATCH(req: Request) {
  const { id, reply } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { error } = await sb()
    .from("homework_status")
    .update({ teacher_reply: reply, replied_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
