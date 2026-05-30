import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.PUSH_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.PUSH_SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function POST(req: NextRequest) {
  try {
    const { subscription, phone, role = "parent" } = await req.json();
    if (!subscription?.endpoint) return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });

    await sb().from("push_subscriptions").upsert({
      endpoint:  subscription.endpoint,
      p256dh:    subscription.keys?.p256dh,
      auth:      subscription.keys?.auth,
      phone:     phone || null,
      role,
      updated_at: new Date().toISOString(),
    }, { onConflict: "endpoint" });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { endpoint } = await req.json();
    if (!endpoint) return NextResponse.json({ error: "endpoint required" }, { status: 400 });
    await sb().from("push_subscriptions").delete().eq("endpoint", endpoint);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
