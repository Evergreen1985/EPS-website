import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

async function toBase64(url: string) {
  try {
    const res = await fetch(url.split("?")[0], { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const buf  = await res.arrayBuffer();
    const mime = (res.headers.get("content-type") || "image/jpeg").split(";")[0];
    return { base64: Buffer.from(buf).toString("base64"), mime };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sectionId  = searchParams.get("sectionId") || "";
  const profileUrl = searchParams.get("profileUrl") || "";
  const debug: any = { steps: [] };

  // Step 1: Env vars
  debug.steps.push({
    step: 1,
    name: "Env vars",
    supabaseUrl:  !!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
    anthropicKey: !!process.env.ANTHROPIC_API_KEY,
  });

  // Step 2: DB photos
  if (sectionId) {
    const { data, error } = await sb()
      .from("section_photos")
      .select("id,photo_url")
      .eq("section_id", sectionId)
      .limit(6);
    debug.steps.push({
      step: 2,
      name: "DB photos",
      count: data?.length,
      error: error?.message,
      firstUrl: data?.[0]?.photo_url?.slice(0, 60),
    });
  } else {
    debug.steps.push({ step: 2, name: "DB photos", skipped: "no sectionId param" });
  }

  // Step 3: Profile photo fetch
  if (profileUrl) {
    try {
      const res = await fetch(profileUrl.split("?")[0], { signal: AbortSignal.timeout(5000) });
      const buf = await res.arrayBuffer();
      debug.steps.push({ step: 3, name: "Profile photo", status: res.status, sizeBytes: buf.byteLength, ok: res.ok });
    } catch (e: any) {
      debug.steps.push({ step: 3, name: "Profile photo", error: e.message });
    }
  } else {
    debug.steps.push({ step: 3, name: "Profile photo", skipped: "no profileUrl param" });
  }

  // Step 4: Claude API
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-opus-4-5",
          max_tokens: 10,
          messages: [{ role: "user", content: "say hi" }],
        }),
      });
      const data = await res.json();
      debug.steps.push({
        step: 4,
        name: "Claude API",
        status: res.status,
        response: data?.content?.[0]?.text,
        error: data?.error?.message,
      });
    } catch (e: any) {
      debug.steps.push({ step: 4, name: "Claude API", error: e.message });
    }
  } else {
    debug.steps.push({ step: 4, name: "Claude API", error: "ANTHROPIC_API_KEY not set!" });
  }

  return NextResponse.json(debug);
}

export async function POST(req: Request) {
  try {
    const { profilePhotoUrl, sectionId, childName } = await req.json();

    if (!profilePhotoUrl || !sectionId) {
      return NextResponse.json({ error: "profilePhotoUrl and sectionId required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ matchedPhotos: [], allPhotos: [], noAi: true });
    }

    const { data: photos } = await sb()
      .from("section_photos")
      .select("id, photo_url, title, ai_caption, uploaded_at")
      .eq("section_id", sectionId)
      .order("uploaded_at", { ascending: false })
      .limit(6);

    if (!photos || photos.length === 0) {
      return NextResponse.json({ matchedPhotos: [], allPhotos: [] });
    }

    const profileImg = await toBase64(profilePhotoUrl);
    if (!profileImg) {
      return NextResponse.json({ matchedPhotos: [], allPhotos: photos, error: "Could not load profile photo" });
    }

    const classImgs = await Promise.all(photos.map(p => toBase64(p.photo_url)));
    const valid = photos
      .map((p, i) => ({ photo: p, img: classImgs[i] }))
      .filter(x => x.img !== null);

    if (valid.length === 0) {
      return NextResponse.json({ matchedPhotos: [], allPhotos: photos, error: "Could not load class photos" });
    }

    const content: any[] = [
      {
        type: "text",
        text: `Image 1 is the profile photo of "${childName}". Images 2 to ${valid.length + 1} are class photos numbered 2,3,4...
Which class photos contain this same child? Reply ONLY with a JSON array like [2,3] or []. No explanation.`,
      },
      { type: "image", source: { type: "base64", media_type: profileImg.mime, data: profileImg.base64 } },
      ...valid.map(x => ({
        type: "image" as const,
        source: { type: "base64" as const, media_type: x.img!.mime, data: x.img!.base64 },
      })),
    ];

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
    console.log("Claude face-match response:", raw);

    let matchedNums: number[] = [];
    try {
      matchedNums = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      const nums = raw.match(/\d+/g);
      if (nums) matchedNums = nums.map(Number);
    }

    const matchedPhotos = matchedNums
      .map(n => valid[n - 2]?.photo)
      .filter(Boolean);

    return NextResponse.json({ matchedPhotos, allPhotos: photos });

  } catch (e: any) {
    console.error("Face match error:", e?.message);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
