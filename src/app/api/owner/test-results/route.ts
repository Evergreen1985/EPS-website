import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

// GET /api/owner/test-results?runId=UUID  — results for a specific run
// GET /api/owner/test-results              — last 20 run summaries
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const runId = searchParams.get("runId");

  const db = sb();

  if (runId) {
    const { data, error } = await db
      .from("test_results")
      .select("*")
      .eq("run_id", runId)
      .order("created_at", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ results: data || [] });
  }

  // Return list of recent runs
  const { data, error } = await db
    .from("test_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ runs: data || [] });
}

// DELETE /api/owner/test-results?runId=UUID — delete a run and its results
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const runId = searchParams.get("runId");
  if (!runId) return NextResponse.json({ error: "runId required" }, { status: 400 });

  const { error } = await sb().from("test_runs").delete().eq("id", runId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
