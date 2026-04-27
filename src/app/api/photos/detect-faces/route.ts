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
  const sectionId = searchParams.get("sectionId") || "";
  const debug: any = {
    visionKey: !!process.env.GOOGLE_VISION_API_KEY,
    supabase:  !!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
  };
  if (sectionId) {
    const { data } = await sb().from("enquiries").select("id,child_name,photo_url").eq("section_id", sectionId);
    debug.childrenInSection = data?.length || 0;
    debug.withPhotos = data?.filter(c => c.photo_url).length || 0;
  }
  return NextResponse.json(debug);
}

// POST: Detect face positions using Google Vision
export async function POST(req: Request) {
  try {
    const { photoId, photoUrl, sectionId } = await req.json();
    if (!photoId || !photoUrl) return NextResponse.json({ error: "photoId and photoUrl required" }, { status: 400 });

    const visionKey = process.env.GOOGLE_VISION_API_KEY;
    if (!visionKey) return NextResponse.json({ error: "GOOGLE_VISION_API_KEY not set" }, { status: 500 });

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
    if (vData.error) return NextResponse.json({ error: vData.error.message }, { status: 500 });

    const faceAnnotations = vData.responses?.[0]?.faceAnnotations || [];

    // Keep existing tags so manual ones are preserved
    const { data: existing } = await sb().from("section_photos").select("ai_tags").eq("id", photoId).single();
    let existingFaces: any[] = [];
    try { existingFaces = existing?.ai_tags ? JSON.parse(existing.ai_tags) : []; } catch {}

    const faces = faceAnnotations.map((face: any, idx: number) => {
      const verts = face.fdBoundingPoly?.vertices || face.boundingPoly?.vertices || [];
      const xs    = verts.map((v: any) => v.x || 0);
      const ys    = verts.map((v: any) => v.y || 0);
      const prev  = existingFaces.find((e: any) => e.index === idx);
      return {
        index: idx,
        x: Math.min(...xs),
        y: Math.min(...ys),
        w: Math.max(...xs) - Math.min(...xs),
        h: Math.max(...ys) - Math.min(...ys),
        childName:  prev?.childName  || null,
        confidence: prev?.confidence || null,
        autoTagged: false,
      };
    });

    await sb().from("section_photos").update({
      ai_tags: JSON.stringify(faces),
    }).eq("id", photoId);

    return NextResponse.json({ success: true, faces, faceCount: faces.length });

  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

// PATCH: Save a name tag for a face
export async function PATCH(req: Request) {
  try {
    const { photoId, faceIndex, childName } = await req.json();
    const { data: photo } = await sb().from("section_photos").select("ai_tags").eq("id", photoId).single();

    let faces: any[] = [];
    try { faces = photo?.ai_tags ? JSON.parse(photo.ai_tags) : []; } catch {}

    const existing = faces.find((f: any) => f.index === faceIndex);
    if (existing) {
      existing.childName  = childName || null;
      existing.confidence = "manual";
    } else {
      faces.push({ index: faceIndex, childName, confidence: "manual", autoTagged: false });
    }

    const namedChildren = faces.filter((f: any) => f.childName).map((f: any) => f.childName).join(",");
    await sb().from("section_photos").update({
      ai_tags:    JSON.stringify(faces),
      ai_caption: namedChildren || null,
    }).eq("id", photoId);

    return NextResponse.json({ success: true, faces });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
