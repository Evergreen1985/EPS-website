import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

// POST /api/owner/run-tests
// Body: { results: TestResult[], runId: string, status: 'completed'|'aborted' }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { runId, results, status, total, passed, failed, errors, skipped } = body;

    if (!runId || !results || !Array.isArray(results)) {
      return NextResponse.json({ error: "Missing runId or results" }, { status: 400 });
    }

    const db = sb();

    // Insert all test results in bulk
    const rows = results.map((r: any) => ({
      run_id:      runId,
      tc_id:       r.tcId,
      module:      r.module,
      sub_module:  r.subModule || null,
      title:       r.title,
      status:      r.status,
      message:     r.message || null,
      duration_ms: r.durationMs || 0,
    }));

    if (rows.length > 0) {
      const { error } = await db.from("test_results").insert(rows);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update run summary
    const { error: runErr } = await db.from("test_runs").update({
      completed_at: new Date().toISOString(),
      status:  status || "completed",
      total:   total || results.length,
      passed:  passed || results.filter((r: any) => r.status === "pass").length,
      failed:  failed || results.filter((r: any) => r.status === "fail").length,
      errors:  errors || results.filter((r: any) => r.status === "error").length,
      skipped: skipped || results.filter((r: any) => r.status === "skip").length,
    }).eq("id", runId);

    if (runErr) return NextResponse.json({ error: runErr.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

// PUT /api/owner/run-tests — create a new run session
export async function PUT(req: Request) {
  try {
    const { triggeredBy } = await req.json().catch(() => ({}));
    const { data, error } = await sb().from("test_runs").insert({
      triggered_by: triggeredBy || "owner",
      status: "running",
    }).select("id").single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ runId: data.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
