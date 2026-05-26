import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const phone     = searchParams.get("phone");
  const sectionId = searchParams.get("sectionId");

  let query = sb()
    .from("section_photos")
    .select("id, photo_url, title, section_name, uploaded_at")
    .order("uploaded_at", { ascending: false })
    .limit(60);

  if (sectionId) {
    // Direct section lookup (legacy)
    query = query.eq("section_id", sectionId);
  } else if (phone) {
    // Look up which sections belong to this parent's children
    const { data: enquiries } = await sb()
      .from("enquiries")
      .select("section_id")
      .eq("phone", phone.trim());

    const sectionIds = (enquiries || [])
      .map((e: any) => e.section_id)
      .filter(Boolean);

    if (sectionIds.length > 0) {
      query = query.in("section_id", sectionIds);
    }
    // if sectionIds is empty → no filter → returns all school photos
  }

  const { data: photos, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ photos: photos || [] });
}
