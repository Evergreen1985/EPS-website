import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySession, COOKIE_NAME } from "@/lib/adminSession";

export const dynamic = "force-dynamic";

function sb() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, key);
}

// GET /api/site-photos → { photos: { slot: url } }
export async function GET() {
  try {
    const { data } = await sb().from("site_photos").select("slot, photo_url");
    const photos = Object.fromEntries((data || []).map((r: any) => [r.slot, r.photo_url]));
    return NextResponse.json({ photos });
  } catch {
    return NextResponse.json({ photos: {} });
  }
}

// POST /api/site-photos → { slot, photo_url }
export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value ?? "";
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slot, photo_url } = await req.json();
  if (!slot || !photo_url) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const { error } = await sb()
    .from("site_photos")
    .upsert({ slot, photo_url, updated_at: new Date().toISOString() }, { onConflict: "slot" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE /api/site-photos?slot=hero
export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value ?? "";
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const slot = req.nextUrl.searchParams.get("slot");
  if (!slot) return NextResponse.json({ error: "Missing slot" }, { status: 400 });

  await sb().from("site_photos").delete().eq("slot", slot);
  return NextResponse.json({ success: true });
}
