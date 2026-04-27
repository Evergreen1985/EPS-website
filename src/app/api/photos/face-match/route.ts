import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

export async function GET() {
  return NextResponse.json({ status: "face-match using name tags" });
}

export async function POST(req: Request) {
  try {
    const { sectionId, childName } = await req.json();
    if (!sectionId || !childName) {
      return NextResponse.json({ error: "sectionId and childName required" }, { status: 400 });
    }

    // Get all photos for section — just reads existing tags, no AI calls
    const { data: photos } = await sb()
      .from("section_photos")
      .select("id, photo_url, title, ai_caption, ai_tags, is_featured, uploaded_at")
      .eq("section_id", sectionId)
      .order("uploaded_at", { ascending: false })
      .limit(100);

    if (!photos || photos.length === 0) {
      return NextResponse.json({ matchedPhotos: [], allPhotos: [] });
    }

    const lowerName = childName.toLowerCase().trim();

    const matchedPhotos = photos.filter(p => {
      // Check ai_caption (plain text names saved by teacher)
      if (p.ai_caption?.toLowerCase().includes(lowerName)) return true;

      // Check ai_tags (JSON array of face objects with childName)
      if (p.ai_tags) {
        try {
          const faces = JSON.parse(p.ai_tags);
          if (Array.isArray(faces)) {
            return faces.some((f: any) =>
              f.childName?.toLowerCase().includes(lowerName)
            );
          }
        } catch {
          if (p.ai_tags.toLowerCase().includes(lowerName)) return true;
        }
      }
      return false;
    });

    return NextResponse.json({ matchedPhotos, allPhotos: photos });

  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
