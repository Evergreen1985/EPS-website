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
  try {
    const { data, error } = await sb()
      .from("owner_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ messages: data || [] });
  } catch (e) {
    console.error("[owner/messages GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, read_by_owner, owner_reply } = body;

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const updates: any = {};
    if (read_by_owner !== undefined) updates.read_by_owner = true;
    if (owner_reply !== undefined) {
      updates.owner_reply = owner_reply;
      updates.replied_at = new Date().toISOString();
    }

    const { data, error } = await sb()
      .from("owner_messages")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ message: data });
  } catch (e) {
    console.error("[owner/messages PATCH]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
