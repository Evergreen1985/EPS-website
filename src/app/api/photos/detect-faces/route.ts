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
    const res = await fetch(url.split("?")[0], { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const buf  = await res.arrayBuffer();
    const mime = (res.headers.get("content-type") || "image/jpeg").split(";")[0];
    return { base64: Buffer.from(buf).toString("base64"), mime };
  } catch { return null; }
}

// POST: Auto-detect + auto-match faces using Google Vision + Claude Vision
export async function POST(req: Request) {
  try {
    const { photoId, photoUrl, sectionId } = await req.json();
    const visionKey  = process.env.GOOGLE_VISION_API_KEY;
    const claudeKey  = process.env.ANTHROPIC_API_KEY;

    if (!photoId || !photoUrl || !sectionId) {
      return NextResponse.json({ error: "photoId, photoUrl, sectionId required" }, { status: 400 });
    }

    // Step 1: Google Vision — detect faces & count
    let faceCount = 0;
    if (visionKey) {
      const vRes = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${visionKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requests: [{
              image: { source: { imageUri: photoUrl.split("?")[0] } },
              features: [{ type: "FACE_DETECTION", maxResults: 20 }],
            }],
          }),
        }
      );
      const vData = await vRes.json();
      faceCount = vData.responses?.[0]?.faceAnnotations?.length || 0;
    }

    // Step 2: Get all children with profile photos in this section
    const { data: childrenData } = await sb()
      .from("enquiries")
      .select("id, child_name, photo_url")
      .eq("section_id", sectionId)
      .not("photo_url", "is", null);

    const children = (childrenData || []).filter(c => c.photo_url);

    // Step 3: Claude Vision — auto-match faces to children profiles
    let faces: any[] = [];

    if (claudeKey && children.length > 0) {
      // Load class photo
      const classImg = await toBase64(photoUrl);
      if (!classImg) return NextResponse.json({ error: "Could not load class photo" }, { status: 400 });

      // Load all children profile photos
      const profileImgs = await Promise.all(
        children.map(async c => {
          const img = await toBase64(c.photo_url!);
          return { child: c, img };
        })
      );
      const validProfiles = profileImgs.filter(p => p.img !== null);

      if (validProfiles.length > 0) {
        // Build Claude message: class photo first, then all profile photos
        const content: any[] = [
          {
            type: "text",
            text: `Image 1 is a class photo. Images 2 to ${validProfiles.length + 1} are individual profile photos of children in this class, in this order: ${validProfiles.map((p, i) => `Image ${i + 2}: ${p.child.child_name}`).join(", ")}.

Look at Image 1 carefully. For each child visible in the class photo, match them to their profile photo.

Reply ONLY with a JSON array like:
[{"childName":"Lekhya","confidence":"high"},{"childName":"Jatin","confidence":"medium"}]

Only include children you can clearly identify. Use confidence: "high", "medium", or "low". No extra text.`
          },
          // Class photo
          { type: "image", source: { type: "base64", media_type: classImg.mime, data: classImg.base64 } },
          // All profile photos
          ...validProfiles.map(p => ({
            type: "image" as const,
            source: { type: "base64" as const, media_type: p.img!.mime, data: p.img!.base64 }
          }))
        ];

        const cRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": claudeKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-opus-4-5",
            max_tokens: 200,
            messages: [{ role: "user", content }],
          }),
        });

        const cData = await cRes.json();
        const raw = cData?.content?.[0]?.text?.trim() || "[]";
        console.log("Claude auto-tag response:", raw);

        try {
          const matched = JSON.parse(raw.replace(/```json|```/g, "").trim());
          faces = matched.map((m: any, i: number) => ({
            index:      i,
            childName:  m.childName,
            confidence: m.confidence,
            autoTagged: true,
          }));
        } catch {
          console.error("Could not parse Claude response:", raw);
        }
      }
    }

    // Fallback: if no Claude or no matches, create blank face slots from Google Vision count
    if (faces.length === 0 && faceCount > 0) {
      faces = Array.from({ length: faceCount }, (_, i) => ({
        index: i, childName: null, confidence: null, autoTagged: false,
      }));
    }

    const namedChildren = faces.filter(f => f.childName).map(f => f.childName).join(",");

    // Save to DB
    await sb().from("section_photos").update({
      ai_tags:    JSON.stringify(faces),
      ai_caption: namedChildren || null,
    }).eq("id", photoId);

    return NextResponse.json({
      success: true,
      faces,
      faceCount,
      autoTagged: faces.filter(f => f.autoTagged).length,
    });

  } catch (e: any) {
    console.error("detect-faces error:", e?.message);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

// PATCH: Teacher corrects/changes a tag
export async function PATCH(req: Request) {
  try {
    const { photoId, faceIndex, childName } = await req.json();
    const client = sb();

    const { data: photo } = await client
      .from("section_photos")
      .select("ai_tags")
      .eq("id", photoId)
      .single();

    let faces: any[] = [];
    try { faces = photo?.ai_tags ? JSON.parse(photo.ai_tags) : []; } catch {}

    // Update or add the face
    const existing = faces.find(f => f.index === faceIndex);
    if (existing) {
      existing.childName   = childName;
      existing.autoTagged  = false; // manually corrected
      existing.confidence  = "manual";
    } else {
      faces.push({ index: faceIndex, childName, confidence: "manual", autoTagged: false });
    }

    const namedChildren = faces.filter(f => f.childName).map(f => f.childName).join(",");

    await client.from("section_photos").update({
      ai_tags:    JSON.stringify(faces),
      ai_caption: namedChildren || null,
    }).eq("id", photoId);

    return NextResponse.json({ success: true, faces });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
