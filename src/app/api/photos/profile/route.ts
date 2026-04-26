import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

export async function GET() {
  return NextResponse.json({ status: "profile route ok" });
}

// Accepts JSON with photoUrl (file already uploaded to Supabase Storage by client)
export async function POST(req: Request) {
  try {
    const { enquiryId, photoUrl } = await req.json();
    if (!enquiryId || !photoUrl) return NextResponse.json({ error: "enquiryId and photoUrl required" }, { status: 400 });

    const { error } = await sb().from("enquiries").update({ photo_url: photoUrl }).eq("id", enquiryId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, photoUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
