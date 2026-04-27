import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

// Fetch image as base64
async function toBase64(url: string): Promise<{ base64: string; mime: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf  = await res.arrayBuffer();
    const mime = res.headers.get("content-type") || "image/jpeg";
    return { base64: Buffer.from(buf).toString("base64"), mime };
  } catch { return null; }
}

export async function POST(req: Request) {
  try {
    const { profilePhotoUrl, sectionId, childName } = await req.json();

    if (!profilePhotoUrl || !sectionId) {
      return NextResponse.json({ error: "profilePhotoUrl and sectionId required" }, { status: 400 });
    }

    // Get only last 10 class photos for face matching (faster)
    const { data: photos } = await sb()
      .from("section_photos")
      .select("id, photo_url, title, ai_caption, ai_tags, uploaded_at")
      .eq("section_id", sectionId)
      .order("uploaded_at", { ascending: false })
      .limit(25);

    if (!photos || photos.length === 0) {
      return NextResponse.json({ matchedPhotos: [], allPhotos: [] });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // No AI key — return all photos as "matched" with no filtering
      return NextResponse.json({ matchedPhotos: photos, allPhotos: photos, noAi: true });
    }

    // Convert profile photo to base64
    const profileImg = await toBase64(profilePhotoUrl);
    if (!profileImg) {
      return NextResponse.json({ matchedPhotos: [], allPhotos: photos, error: "Could not load profile photo" });
    }

    const matchedPhotos: any[] = [];

    // Check each class photo for face match (batch in groups of 3)
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const classImg = await toBase64(photo.photo_url);
      if (!classImg) continue;

      try {
        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-opus-4-5",
            max_tokens: 50,
            messages: [{
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Image 1 is a profile photo of a child named "${childName}". Image 2 is a class/group photo from their school. 

Look carefully at the face in Image 1. Does that same child appear anywhere in Image 2? Consider face shape, skin tone, hair, and overall appearance. Even if the child is small or in the background, try to identify them.

Reply with ONLY the word "yes" or "no".`
                },
                { type: "image", source: { type: "base64", media_type: profileImg.mime as any, data: profileImg.base64 } },
                { type: "image", source: { type: "base64", media_type: classImg.mime as any, data: classImg.base64 } },
              ]
            }]
          }),
        });

        const data = await resp.json();
        const answer = data?.content?.[0]?.text?.toLowerCase().trim();
        console.log(`Face match photo ${i+1}/${photos.length}: "${answer}" — ${photo.photo_url.slice(-30)}`);
        if (answer === "yes" || answer?.startsWith("yes")) {
          matchedPhotos.push(photo);
        }
      } catch { /* skip photo on error */ }
    }

    return NextResponse.json({ matchedPhotos, allPhotos: photos });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
