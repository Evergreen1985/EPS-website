import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

async function toBase64(url: string): Promise<{ base64: string; mime: string } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const buf  = await res.arrayBuffer();
    const mime = (res.headers.get("content-type") || "image/jpeg").split(";")[0];
    return { base64: Buffer.from(buf).toString("base64"), mime };
  } catch { return null; }
}

export const maxDuration = 60; // Vercel Pro: 60s max

export async function POST(req: Request) {
  try {
    const { profilePhotoUrl, sectionId, childName } = await req.json();
    if (!profilePhotoUrl || !sectionId) {
      return NextResponse.json({ error: "profilePhotoUrl and sectionId required" }, { status: 400 });
    }

    // Get last 25 class photos
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
      return NextResponse.json({ matchedPhotos: photos, allPhotos: photos, noAi: true });
    }

    // Load profile photo
    const profileImg = await toBase64(profilePhotoUrl);
    if (!profileImg) {
      return NextResponse.json({ matchedPhotos: [], allPhotos: photos, error: "Could not load profile photo" });
    }

    const matchedPhotos: any[] = [];

    // Process in batches of 8 photos per Claude call (max ~20 images per message)
    const BATCH = 8;
    for (let start = 0; start < photos.length; start += BATCH) {
      const batch = photos.slice(start, start + BATCH);

      // Load batch images
      const batchImgs = await Promise.all(batch.map(p => toBase64(p.photo_url)));

      // Build content array: profile first, then batch
      const content: any[] = [
        {
          type: "text",
          text: `Image 1 is the profile photo of a child named "${childName}". Images 2 to ${batch.length + 1} are class photos (numbered 2, 3, 4...).

Look carefully at the child's face in Image 1. Check each class photo and tell me which ones contain this same child.

Reply with ONLY a JSON array of the image numbers that contain this child. Example: [2,4,5] or [] if none match. No other text.`
        },
        // Profile photo
        { type: "image", source: { type: "base64", media_type: profileImg.mime, data: profileImg.base64 } },
      ];

      // Add batch photos
      batchImgs.forEach((img) => {
        if (img) {
          content.push({ type: "image", source: { type: "base64", media_type: img.mime, data: img.base64 } });
        } else {
          // placeholder text for failed image
          content.push({ type: "text", text: "(image could not be loaded)" });
        }
      });

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
            max_tokens: 100,
            messages: [{ role: "user", content }],
          }),
        });

        const data = await resp.json();
        const raw  = data?.content?.[0]?.text?.trim() || "[]";
        console.log(`Batch ${start}-${start+BATCH}: Claude says: ${raw}`);

        // Parse the array of matched image numbers
        let matchedNums: number[] = [];
        try {
          matchedNums = JSON.parse(raw.replace(/```json|```/g, "").trim());
        } catch {
          // fallback: extract numbers from response
          const nums = raw.match(/\d+/g);
          if (nums) matchedNums = nums.map(Number);
        }

        // matchedNums are 1-indexed where 1=profile, 2=first class photo
        // So class photo index = matchedNum - 2
        for (const num of matchedNums) {
          const idx = num - 2; // -2 because 1=profile, 2=first batch photo
          if (idx >= 0 && idx < batch.length) {
            matchedPhotos.push(batch[idx]);
          }
        }
      } catch (e) {
        console.error("Batch error:", e);
      }
    }

    console.log(`Face match complete: ${matchedPhotos.length} matches out of ${photos.length} photos`);
    return NextResponse.json({ matchedPhotos, allPhotos: photos });

  } catch (e: any) {
    console.error("Face match error:", e);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
