import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function sb() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, key);
}

// GET /api/transport/ride-logs?date=YYYY-MM-DD&route_id=route_morning&child_id=UUID
export async function GET(req: NextRequest) {
  const date    = req.nextUrl.searchParams.get("date") || new Date().toISOString().slice(0, 10);
  const routeId = req.nextUrl.searchParams.get("route_id");
  const childId = req.nextUrl.searchParams.get("child_id");

  let query = sb().from("ride_logs").select("*").eq("date", date).order("child_name");
  if (routeId) query = query.eq("route_id", routeId);
  if (childId) query = query.eq("child_id", childId);

  let { data, error } = await query;

  // If route_id column doesn't exist yet (SQL migration Section 9 not run), retry without route filter
  if (error && error.message.includes("route_id")) {
    let fallback = sb().from("ride_logs").select("*").eq("date", date).order("child_name");
    if (childId) fallback = fallback.eq("child_id", childId);
    const res = await fallback;
    data  = res.data;
    error = res.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ride_logs: data || [] });
}

// POST /api/transport/ride-logs — upsert a ride log entry (driver marks boarding/alighting)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { child_id, child_name, date, route_id, checkin_time, checkout_time, checked_by, status, notes, boarded_by, dropped_by } = body;
  if (!child_id || !child_name || !date || !checked_by) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const row: Record<string, unknown> = {
    child_id, child_name, date,
    route_id: route_id || "route_morning",
    checkin_time, checkout_time, checked_by,
    status: status || "waiting", notes: notes || null, updated_at: now,
  };
  if (boarded_by !== undefined) row.boarded_by = boarded_by;
  if (dropped_by  !== undefined) row.dropped_by  = dropped_by;

  // Try with the new unique constraint (child_id, date, route_id) first
  let { error } = await sb().from("ride_logs").upsert(row, { onConflict: "child_id,date,route_id" });

  // Fall back to old constraint if route_id column doesn't exist yet (migration not run)
  if (error && error.message.includes("route_id")) {
    const { route_id: _r, boarded_by: _b, dropped_by: _d, ...coreRow } = row;
    const retry = await sb().from("ride_logs").upsert(coreRow, { onConflict: "child_id,date" });
    error = retry.error;
  } else if (error && (error.message.includes("boarded_by") || error.message.includes("dropped_by"))) {
    // Audit columns not migrated yet — retry without them
    const { boarded_by: _b, dropped_by: _d, ...coreRow } = row;
    const retry = await sb().from("ride_logs").upsert(coreRow, { onConflict: "child_id,date,route_id" });
    error = retry.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
