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
    const clean = url.split("?")[0];
    const res   = await fetch(clean, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const buf  = await res.arrayBuffer();
    const mime = (res.headers.get("content-type") || "image/jpeg").split(";")[0];
    return { base64: Buffer.from(buf).toString("base64"), mime };
  } catch { return null; }
}

// GET: Debug endpoint
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sectionId = searchParams.get("sectionId") || "";
  const debug: any = {};

  debug.visionKey  = !!process.env.GOOGLE_VISION_API_KEY;
  debug.claudeKey  = !!process.env.ANTHROPIC_API_KEY;
  debug.supabase   = !!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);

  if (sectionId) {
    const { data, error } = await sb()
      .from("enquiries")
      .select("id, child_name, photo_url")
      .eq("section_id", sectionId)
      .not("photo_url", "is", null);
    debug.childrenWithPhotos = data?.length || 0;
    debug.dbError = error?.message;
    debug.children = data?.map(c => ({ name: c.child_name, hasPhoto: !!c.photo_url }));
  }

  return NextResponse.json(debug);
}

export async function POST(req: Request) {
  const log: string[] = [];
  try {
    const { photoId, photoUrl, sectionId } = await req.json();
    log.push(`Start: photoId=${photoId} sectionId=${sectionId}`);

    if (!photoId || !photoUrl || !sectionId) {
      return NextResponse.json({ error: "photoId, photoUrl, sectionId required" }, { status: 400 });
    }

    const visionKey = process.env.GOOGLE_VISION_API_KEY;
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    log.push(`Keys: vision=${!!visionKey} claude=${!!claudeKey}`);

    // Step 1: Google Vision face count
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
      if (vData.error) {
        log.push(`Vision error: ${vData.error.message}`);
      } else {
        faceCount = vData.responses?.[0]?.faceAnnotations?.length || 0;
        log.push(`Vision: ${faceCount} faces detected`);
      }
    } else {
      log.push("No Google Vision key — skipping face count");
    }

    // Step 2: Get children with profile photos in this section
    const { data: childrenData, error: dbErr } = await sb()
      .from("enquiries")
      .select("id, child_name, photo_url")
      .eq("section_id", sectionId)
      .not("photo_url", "is", null);

    const children = (childrenData || []).filter(c => c.photo_url);
    log.push(`Children with profiles: ${children.length} (db error: ${dbErr?.message || "none"})`);

    // Step 3: Claude Vision auto-match
    let faces: any[] = [];

    if (claudeKey && children.length > 0) {
      const classImg = await toBase64(photoUrl);
      if (!classImg) {
        log.push("Could not load class photo");
      } else {
        log.push(`Class photo loaded: ${Math.round(classImg.base64.length / 1024)}KB`);

        // Load profile photos
        const profiles: { child: any; img: any }[] = [];
        for (const c of children) {
          const img = await toBase64(c.photo_url!);
          if (img) {
            profiles.push({ child: c, img });
            log.push(`Loaded profile: ${c.child_name} (${Math.round(img.base64.length / 1024)}KB)`);
          } else {
            log.push(`Failed to load profile: ${c.child_name}`);
          }
        }

        if (profiles.length > 0) {
          const content: any[] = [
            {
              type: "text",
              text: `Image 1 is a class/group photo. The following images are profile photos of children in this class:
${profiles.map((p, i) => `Image ${i + 2}: ${p.child.child_name}`).join("\n")}

For each child you can identify in Image 1, match them to their profile photo.
Reply ONLY with valid JSON array:
[{"childName":"Name","confidence":"high"},{"childName":"Name2","confidence":"medium"}]
Only include children you can clearly identify. No extra text.`,
            },
            { type: "image", source: { type: "base64", media_type: classImg.mime, data: classImg.base64 } },
            ...profiles.map(p => ({
              type: "image" as const,
              source: { type: "base64" as const, media_type: p.img.mime, data: p.img.base64 },
            })),
          ];

          log.push(`Calling Claude with ${profiles.length + 1} images...`);

          const cRes = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": claudeKey,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: "claude-opus-4-5",
              max_tokens: 300,
              messages: [{ role: "user", content }],
            }),
          });

          const cData = await cRes.json();
          log.push(`Claude status: ${cRes.status}`);

          if (cData.error) {
            log.push(`Claude error: ${cData.error.message} (${cData.error.type})`);
          } else {
            const raw = cData?.content?.[0]?.text?.trim() || "[]";
            log.push(`Claude response: ${raw}`);
            try {
              const matched = JSON.parse(raw.replace(/```json|```/g, "").trim());
              faces = matched.map((m: any, i: number) => ({
                index:      i,
                childName:  m.childName,
                confidence: m.confidence,
                autoTagged: true,
              }));
              log.push(`Parsed ${faces.length} matches`);
            } catch (e: any) {
              log.push(`Parse error: ${e.message} | raw: ${raw}`);
            }
          }
        }
      }
    } else {
      log.push(`Skipping Claude: key=${!!claudeKey} children=${children.length}`);
    }

    // Fallback: blank slots from face count
    if (faces.length === 0 && faceCount > 0) {
      faces = Array.from({ length: faceCount }, (_, i) => ({
        index: i, childName: null, confidence: null, autoTagged: false,
      }));
      log.push(`Created ${faceCount} blank face slots`);
    }

    const namedChildren = faces.filter(f => f.childName).map(f => f.childName).join(",");

    await sb().from("section_photos").update({
      ai_tags:    JSON.stringify(faces),
      ai_caption: namedChildren || null,
    }).eq("id", photoId);

    log.push(`Saved ${faces.length} faces to DB`);

    return NextResponse.json({ success: true, faces, faceCount, autoTagged: faces.filter(f => f.autoTagged).length, log });

  } catch (e: any) {
    log.push(`CRASH: ${e?.message}`);
    return NextResponse.json({ error: e?.message, log }, { status: 500 });
  }
}

// PATCH: Correct a tag manually
export async function PATCH(req: Request) {
  try {
    const { photoId, faceIndex, childName } = await req.json();

    const { data: photo } = await sb()
      .from("section_photos")
      .select("ai_tags")
      .eq("id", photoId)
      .single();

    let faces: any[] = [];
    try { faces = photo?.ai_tags ? JSON.parse(photo.ai_tags) : []; } catch {}

    const existing = faces.find(f => f.index === faceIndex);
    if (existing) {
      existing.childName  = childName || null;
      existing.confidence = "manual";
      existing.autoTagged = false;
    } else {
      faces.push({ index: faceIndex, childName, confidence: "manual", autoTagged: false });
    }

    const namedChildren = faces.filter(f => f.childName).map(f => f.childName).join(",");

    await sb().from("section_photos").update({
      ai_tags:    JSON.stringify(faces),
      ai_caption: namedChildren || null,
    }).eq("id", photoId);

    return NextResponse.json({ success: true, faces });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
