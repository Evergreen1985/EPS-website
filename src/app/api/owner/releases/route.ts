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

// Promote a verified web build to production (evergreenprepschools.com) by
// fast-forwarding the `production` branch to the approved commit. Only runs when
// a promote token is configured; otherwise the approval is just recorded.
async function promoteWeb(commitSha: string): Promise<{ ok: boolean; detail: string }> {
  const token = process.env.GITHUB_PROMOTE_TOKEN;
  const repo  = process.env.PROMOTE_REPO || "Evergreen1985/EPS-website";
  const branch = process.env.PROMOTE_BRANCH || "production";
  if (!token) return { ok: false, detail: "no GITHUB_PROMOTE_TOKEN configured — approval recorded, promotion pending setup" };
  if (!commitSha) return { ok: false, detail: "no commit on this release to promote" };
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/${branch}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
      body: JSON.stringify({ sha: commitSha, force: false }),
    });
    if (res.ok) return { ok: true, detail: `production branch -> ${commitSha.slice(0, 7)} (Vercel will deploy evergreenprepschools.com)` };
    const t = await res.text();
    return { ok: false, detail: `GitHub promote failed (${res.status}): ${t.slice(0, 160)}` };
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
      promo = await promoteWeb(rel.commit_sha);
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
