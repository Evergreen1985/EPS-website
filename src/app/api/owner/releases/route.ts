import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { verifyOwnerSession, OWNER_COOKIE_NAME } from "@/lib/ownerSession";

export const dynamic = "force-dynamic";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

async function owner() {
  const token = (await cookies()).get(OWNER_COOKIE_NAME)?.value;
  return token ? await verifyOwnerSession(token) : null;
}

// Promote the latest verified build (currently on edu.intelliverify.in staging)
// LIVE to evergreenprepschools.com by aliasing that exact Vercel deployment onto
// the production domains. evergreen is pinned (gitBranch=production) so normal
// pushes don't touch it — only this approval re-aliases it.
async function promoteWeb(deploymentId?: string | null): Promise<{ ok: boolean; detail: string }> {
  const token = process.env.VERCEL_TOKEN;
  const team  = process.env.VERCEL_TEAM_ID || "";
  const proj  = process.env.VERCEL_PROJECT_ID || "prj_q532S7EaZj7XNSBk6jTnDnpH2DlW";
  if (!token) return { ok: false, detail: "no VERCEL_TOKEN configured — approval recorded, promotion pending env setup" };
  const q = team ? `&teamId=${team}` : "";
  try {
    let uid = deploymentId || "";
    let url = "", sha = "";
    if (!uid) {
      // fallback: the latest ready production deployment
      const dres = await fetch(`https://api.vercel.com/v6/deployments?projectId=${proj}&target=production&state=READY&limit=1${q}`,
        { headers: { Authorization: `Bearer ${token}` } });
      const dep = ((await dres.json()).deployments || [])[0];
      if (!dep?.uid) return { ok: false, detail: "no ready production deployment found to promote" };
      uid = dep.uid; url = dep.url; sha = (dep.meta?.gitlabCommitSha || "").slice(0, 7);
    }
    for (const alias of ["evergreenprepschools.com", "www.evergreenprepschools.com"]) {
      const r = await fetch(`https://api.vercel.com/v2/deployments/${uid}/aliases?teamId=${team}`,
        { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ alias }) });
      if (!r.ok) return { ok: false, detail: `alias ${alias} failed (${r.status}): ${(await r.text()).slice(0, 120)}` };
    }
    return { ok: true, detail: `promoted ${url || uid}${sha ? ` (${sha})` : ""} → evergreenprepschools.com` };
  } catch (e: any) {
    return { ok: false, detail: "promote error: " + (e?.message || "unknown") };
  }
}

export async function GET() {
  if (!(await owner())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await sb().from("qa_releases").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ releases: data || [] });
}

export async function POST(req: NextRequest) {
  const o = await owner();
  if (!o) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { action } = body;
  const now = new Date().toISOString();

  if (action === "create") {
    const { kind = "web", version, commit_sha, title, staging_url, notes } = body;
    if (!version) return NextResponse.json({ error: "version required" }, { status: 400 });
    const { error } = await sb().from("qa_releases").insert({ kind, version, commit_sha, title, staging_url, notes, status: "pending" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "reject") {
    const { id, notes } = body;
    const { error } = await sb().from("qa_releases").update({ status: "rejected", notes: notes || null, updated_at: now }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "approve") {
    const { id } = body;
    const { data: rel } = await sb().from("qa_releases").select("*").eq("id", id).maybeSingle();
    if (!rel) return NextResponse.json({ error: "release not found" }, { status: 404 });

    // App releases are promoted out-of-band (EAS/GitHub release); web auto-promotes here.
    let promo = { ok: true, detail: "approved" };
    let prodUrl = rel.prod_url;
    if (rel.kind === "web") {
      promo = await promoteWeb(rel.deployment_id);
      prodUrl = "https://evergreenprepschools.com";
    } else {
      prodUrl = rel.staging_url; // app: the approved APK is the live one
    }

    const patch: any = {
      status: promo.ok ? "live" : "approved",
      approved_by: o.name || o.username || "owner",
      approved_at: now,
      prod_url: prodUrl,
      notes: promo.detail,
      updated_at: now,
    };
    if (promo.ok) patch.promoted_at = now;
    const { error } = await sb().from("qa_releases").update(patch).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, promoted: promo.ok, detail: promo.detail });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
