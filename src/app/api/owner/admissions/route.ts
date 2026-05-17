import { NextResponse } from "next/server";
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
      .from("enquiries")
      .select("id, child_name, parent_name, phone, program_label, section_name, status, created_at, academic_year_id")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ enquiries: data || [] });
  } catch (e) {
    console.error("[owner/admissions GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
