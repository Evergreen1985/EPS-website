import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function sb() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, key);
}

function todayIST() {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// GET /api/transport/report?date=YYYY-MM-DD&route_id=route_morning
export async function GET(req: NextRequest) {
  const date    = req.nextUrl.searchParams.get("date") || todayIST();
  const routeId = req.nextUrl.searchParams.get("route_id");

  let trailQuery = sb()
    .from("vehicle_location_history")
    .select("id,route_id,latitude,longitude,shared_by,recorded_at")
    .eq("date", date)
    .order("recorded_at", { ascending: true });
  if (routeId) trailQuery = trailQuery.eq("route_id", routeId);

  const rideQuery = sb()
    .from("ride_logs")
    .select("id,child_name,status,checkin_time,checkout_time,checked_by,boarded_by,dropped_by,date")
    .eq("date", date)
    .order("child_name");

  const [trailRes, rideRes] = await Promise.all([trailQuery, rideQuery]);

  if (trailRes.error) return NextResponse.json({ error: trailRes.error.message }, { status: 500 });

  return NextResponse.json({
    trail:     trailRes.data || [],
    ride_logs: rideRes.data || [],
  });
}
