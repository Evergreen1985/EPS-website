import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // e.g. "2026-05"
    const client = sb();

    let query = client.from("expenses").select("*").order("date", { ascending: false });
    if (month) {
      query = query.gte("date", `${month}-01`).lte("date", `${month}-31`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ expenses: data || [] });
  } catch (e) {
    console.error("[owner/expenses GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, title, amount, date, notes, added_by } = body;

    if (!category || !title || !amount || !date) {
      return NextResponse.json({ error: "category, title, amount, date are required" }, { status: 400 });
    }

    const { data, error } = await sb()
      .from("expenses")
      .insert({ category, title, amount: Number(amount), date, notes: notes || null, added_by: added_by || "owner" })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ expense: data });
  } catch (e) {
    console.error("[owner/expenses POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const { error } = await sb().from("expenses").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[owner/expenses DELETE]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
