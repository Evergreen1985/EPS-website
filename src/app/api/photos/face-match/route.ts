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
    const clean = url.split("?")[0]; // remove cache params
    const res   = await fetch(clean, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const buf  = await res.arrayBuffer();
    const mime = (res.headers.get("content-type") || "image/jpeg").split(";")[0];
    return { base64: Buffer.from(buf).toString("base64"), mime };
  } catch (e) {
    console.error("Image fetch error:", e);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { profilePhotoUrl, sectionId, childName } = await req.json();
    console.log("Face match start:", childName, sectionId);

    if (!profilePhotoUrl || !sectionId) {
      return NextResponse.json({ error: "profilePhotoUrl and sectionId required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log("API key present:", !!apiKey);
    if (!apiKey) return NextResponse.json({ matchedPhotos: [], allPhotos: [], noAi: true });

    // Get last 6 photos only — fits in one fast Claude call
    const { data: photos, error: dbErr } = await sb()
      .from("section_photos")
      .select("id, photo_url, title, ai_caption, uploaded_at")
      .eq("section_id", sectionId)
      .order("uploaded_at", { ascending: false })
      .limit(6);

    console.log("Photos fetched:", photos?.length, dbErr?.message);
    if (!photos || photos.length === 0) {
      return NextResponse.json({ matchedPhotos: [], allPhotos: [] });
    }

    // Load profile photo
    const profileImg = await toBase64(profilePhotoUrl.split("?")[0]);
    if (!profileImg) {
      console.error("Could not load profile photo:", profilePhotoUrl);
      return NextResponse.json({ matchedPhotos: [], allPhotos: photos, error: "Could not load profile photo" });
    }
    console.log("Profile photo loaded, size:", profileImg.base64.length);

    // Load all class photos
    const classImgs = await Promise.all(photos.map(p => toBase64(p.photo_url)));
    const validPhotos = photos.filter((_, i) => classImgs[i] !== null);
    const validImgs   = classImgs.filter(img => img !== null) as { base64: string; mime: string }[];
    console.log("Class photos loaded:", validImgs.length, "/", photos.length);

    if (validImgs.length === 0) {
      return NextResponse.json({ matchedPhotos: [], allPhotos: photos, error: "Could not load class photos" });
    }

    // ONE Claude call: profile + all class photos
    const content: any[] = [
      {
        type: "text",
        text: `Image 1 is the profile photo of a child named "${childName}".
Images 2 to ${validImgs.length + 1} are class photos numbered 2, 3, 4...

Look carefully at the face in Image 1. Which class photos contain this same child?

Reply ONLY with a JSON array of matching image numbers like [2,3] or [] if none. No explanation.`
      },
      { type: "image", source: { type: "base64", media_type: profileImg.mime as any, data: profileImg.base64 } },
      ...validImgs.map(img => ({
        type: "image" as const,
        source: { type: "base64" as const, media_type: img.mime as any, data: img.base64 }
      }))
    ];

    console.log("Calling Claude with", validImgs.length + 1, "images...");

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
        messages: [{ role: "user", content }],
      }),
    });

    const claudeData = await resp.json();
    const raw = claudeData?.content?.[0]?.text?.trim() || "[]";
    console.log("Claude response:", raw);

    let matchedNums: number[] = [];
    try {
      matchedNums = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      const nums = raw.match(/\d+/g);
      if (nums) matchedNums = nums.map(Number);
    }

    // Convert image numbers to photos (image 2 = index 0, image 3 = index 1...)
    const matchedPhotos = matchedNums
      .map(n => validPhotos[n - 2])
      .filter(Boolean);

    console.log("Matched:", matchedPhotos.length, "photos");
    return NextResponse.json({ matchedPhotos, allPhotos: photos });

  } catch (e: any) {
    console.error("Face match crash:", e?.message);
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
