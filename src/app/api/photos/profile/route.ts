import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

// POST: Upload child profile photo
export async function POST(req: Request) {
  try {
    const formData  = await req.formData();
    const file      = formData.get("file") as File;
    const enquiryId = formData.get("enquiryId") as string;
    const childName = formData.get("childName") as string;

    if (!file || !enquiryId) return NextResponse.json({ error: "File and enquiryId required" }, { status: 400 });

    const client = sb();
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `profiles/${enquiryId}.${ext}`;
    const buffer   = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await client.storage
      .from("school-photos")
      .upload(fileName, buffer, { contentType: file.type, upsert: true });

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    const { data: urlData } = client.storage.from("school-photos").getPublicUrl(fileName);
    const photoUrl = urlData.publicUrl;

    // Update enquiry with profile photo URL
    await client.from("enquiries").update({ photo_url: photoUrl }).eq("id", enquiryId);

    return NextResponse.json({ success: true, photoUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
