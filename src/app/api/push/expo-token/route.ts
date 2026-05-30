import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function POST(req: NextRequest) {
  try {
    const { phone, token, platform } = await req.json();
    if (!phone || !token) return NextResponse.json({ error: "phone and token required" }, { status: 400 });

    await sb().from("expo_push_tokens").upsert({
      phone,
      token,
      platform: platform || "android",
      updated_at: new Date().toISOString(),
    }, { onConflict: "token" });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });
    await sb().from("expo_push_tokens").delete().eq("token", token);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
