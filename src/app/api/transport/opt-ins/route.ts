import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function sb() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, key);
}

/**
 * Returns true if a transport_opt_ins record is active for a given date.
 * mode=permanent → active if opted_in=true (ignoring dates unless end_date set)
 * mode=today/week/month/custom → active if start_date <= date <= end_date
 */
function isActiveForDate(row: any, date: string): boolean {
  if (!row.opted_in) return false;
  if (row.mode === "permanent") {
    // permanent with optional end_date
    if (row.end_date && row.end_date < date) return false;
    if (row.start_date && row.start_date > date) return false;
    return true;
  }
  // date-bounded modes
  if (!row.start_date || !row.end_date) return false;
  return row.start_date <= date && row.end_date >= date;
}

// GET /api/transport/opt-ins
//   ?date=YYYY-MM-DD         → all children active on that date
//   ?child_id=UUID           → single child's opt-in record
export async function GET(req: NextRequest) {
  const date    = req.nextUrl.searchParams.get("date");
  const childId = req.nextUrl.searchParams.get("child_id");

  if (childId) {
    const { data, error } = await sb()
      .from("transport_opt_ins")
      .select("*")
      .eq("child_id", childId)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ opt_in: data || null });
  }

  // Return all opted-in records, then filter by date in JS
  const { data, error } = await sb()
    .from("transport_opt_ins")
    .select("*")
    .eq("opted_in", true)
    .order("child_name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const filterDate = date || new Date().toISOString().slice(0, 10);
  const active = (data || []).filter((r: any) => isActiveForDate(r, filterDate));
  return NextResponse.json({ opt_ins: active });
}

// POST /api/transport/opt-ins — upsert a child's transport opt-in settings
// Body: { child_id, child_name, parent_phone, opted_in, mode, start_date?, end_date?, updated_by }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { child_id, child_name, parent_phone, opted_in, mode, start_date, end_date, updated_by } = body;

  if (!child_id || !child_name) {
    return NextResponse.json({ error: "Missing child_id or child_name" }, { status: 400 });
  }

  // Derive end_date from mode if not provided
  let resolvedStart = start_date || new Date().toISOString().slice(0, 10);
  let resolvedEnd   = end_date || null;

  if (opted_in) {
    const s = new Date(resolvedStart);
    if (mode === "today") {
      resolvedEnd = resolvedStart;
    } else if (mode === "week") {
      const e = new Date(s); e.setDate(e.getDate() + 6);
      resolvedEnd = e.toISOString().slice(0, 10);
    } else if (mode === "month") {
      const e = new Date(s); e.setDate(e.getDate() + 29);
      resolvedEnd = e.toISOString().slice(0, 10);
    } else if (mode === "permanent") {
      resolvedEnd = null;
    }
    // mode === "custom": end_date must be provided by caller
  }

  const { error } = await sb()
    .from("transport_opt_ins")
    .upsert(
      {
        child_id,
        child_name,
        parent_phone: parent_phone || "",
        opted_in: opted_in ?? false,
        mode: mode || "permanent",
        start_date: resolvedStart,
        end_date:   resolvedEnd,
        updated_by: updated_by || "parent",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "child_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// PATCH /api/transport/opt-ins — update pickup_order or drop_order for a child
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { child_id, pickup_order, drop_order } = body;
  if (!child_id) return NextResponse.json({ error: "Missing child_id" }, { status: 400 });

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (pickup_order != null) updates.pickup_order = pickup_order;
  if (drop_order   != null) updates.drop_order   = drop_order;

  const { error } = await sb().from("transport_opt_ins").update(updates).eq("child_id", child_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
