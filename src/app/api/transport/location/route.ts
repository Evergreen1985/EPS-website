import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function sb() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, key);
}

const HEADERS = { "Cache-Control": "no-store, no-cache, must-revalidate" };

// GET /api/transport/location?route_id=route_morning
// Only returns locations updated within the last 30 minutes so stale rows auto-disappear.
export async function GET(req: NextRequest) {
  const routeId = req.nextUrl.searchParams.get("route_id");
  const cutoff  = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  let query = sb().from("vehicle_location").select("*").gte("updated_at", cutoff).neq("latitude", 0);
  if (routeId) query = query.eq("route_id", routeId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ locations: data || [] }, { headers: HEADERS });
}

// PUT /api/transport/location — staff member pushes their GPS position
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { route_id, latitude, longitude, shared_by } = body;
  if (!route_id || latitude == null || longitude == null) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { error } = await sb()
    .from("vehicle_location")
    .upsert(
      { route_id, latitude, longitude, updated_at: new Date().toISOString() },
      { onConflict: "route_id" }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // shared_by is optional — silently skip if column not yet migrated
  if (shared_by != null) {
    await sb().from("vehicle_location").update({ shared_by }).eq("route_id", route_id).then(() => {});
  }

  // Append to history trail (only real GPS fixes, not the lat=0 stop signal)
  if (latitude !== 0) {
    const istDate = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await sb()
      .from("vehicle_location_history")
      .insert({ route_id, latitude, longitude, shared_by: shared_by || "", date: istDate, recorded_at: new Date().toISOString() })
      .then(() => {}); // silently ignored if table not yet created
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/transport/location?route_id=route_morning — stop sharing (removes row entirely)
export async function DELETE(req: NextRequest) {
  const routeId = req.nextUrl.searchParams.get("route_id");
  if (!routeId) return NextResponse.json({ error: "route_id required" }, { status: 400 });

  const { error } = await sb().from("vehicle_location").delete().eq("route_id", routeId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true }, { headers: HEADERS });
}
