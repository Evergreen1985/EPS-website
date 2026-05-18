import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function sb() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, key);
}

// POST /api/transport/cleanup
// Deletes vehicle_location_history older than 7 days and ride_logs older than 30 days.
// Called manually from the admin report panel, or automatically via pg_cron every Sunday.
export async function POST() {
  const locCutoff  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000).toISOString();
  const rideDate   = new Date(Date.now() + 5.5 * 60 * 60 * 1000 - 30 * 24 * 60 * 60 * 1000)
                       .toISOString().slice(0, 10); // 30 days ago in IST

  const [locRes, rideRes] = await Promise.all([
    sb().from("vehicle_location_history").delete().lt("recorded_at", locCutoff),
    sb().from("ride_logs").delete().lt("date", rideDate),
  ]);

  if (locRes.error)  return NextResponse.json({ error: locRes.error.message  }, { status: 500 });
  if (rideRes.error) return NextResponse.json({ error: rideRes.error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
