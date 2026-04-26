import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

export async function POST(req: Request) {
  try {
    const formData  = await req.formData();
    const file      = formData.get("file") as File;
    const sectionId = formData.get("sectionId") as string;
    const sectionName = formData.get("sectionName") as string;
    const title     = formData.get("title") as string || "";
    const eventName = formData.get("eventName") as string || "";
    const uploadedBy = formData.get("uploadedBy") as string || "";
    const uploadedByRole = formData.get("uploadedByRole") as string || "teacher";
    const isFeatured = formData.get("isFeatured") === "true";

    if (!file || !sectionId) {
      return NextResponse.json({ error: "File and sectionId required" }, { status: 400 });
    }

    // Upload to Supabase Storage
    const client = sb();
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${sectionId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await client.storage
      .from("school-photos")
      .upload(fileName, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = client.storage.from("school-photos").getPublicUrl(fileName);
    const photoUrl = urlData.publicUrl;

    // Save to section_photos table
    const { data: photo, error: dbError } = await client.from("section_photos").insert({
      section_id:       sectionId,
      section_name:     sectionName,
      title:            title || null,
      photo_url:        photoUrl,
      event_name:       eventName || null,
      uploaded_by:      uploadedBy,
      uploaded_by_role: uploadedByRole,
      is_featured:      isFeatured,
    }).select().single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, photo, photoUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
