import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

export async function GET() {
  return NextResponse.json({ status: "upload route ok" });
}

// Now receives JSON with photoUrl (file already uploaded to Supabase Storage by client)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { photoUrl, sectionId, sectionName, title, uploadedBy, uploadedByRole, isFeatured } = body;

    if (!photoUrl || !sectionId) {
      return NextResponse.json({ error: "photoUrl and sectionId required" }, { status: 400 });
    }

    const { data: photo, error: dbError } = await sb()
      .from("section_photos")
      .insert({
        section_id:       sectionId,
        section_name:     sectionName || null,
        title:            title || null,
        photo_url:        photoUrl,
        uploaded_by:      uploadedBy || null,
        uploaded_by_role: uploadedByRole || "teacher",
        is_featured:      isFeatured || false,
      })
      .select()
      .single();

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

    return NextResponse.json({ success: true, photo });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
