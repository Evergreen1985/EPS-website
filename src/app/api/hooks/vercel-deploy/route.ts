import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

// Vercel posts here on deployment events. Each successful STAGING deploy
// (production-target build, served on edu.intelliverify.in) auto-creates a
// "pending" release in /qa for the owner to approve → promote to evergreen.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const secret = process.env.VERCEL_WEBHOOK_SECRET;
  // Verify Vercel's HMAC-SHA1 signature
  if (secret) {
    const sig = req.headers.get("x-vercel-signature") || "";
    const expected = crypto.createHmac("sha1", secret).update(raw).digest("hex");
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return NextResponse.json({ error: "bad signature" }, { status: 401 });
    }
  }

  let body: any = {};
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ ok: true }); }

  const type = body?.type || "";
  if (type !== "deployment.succeeded" && type !== "deployment-ready" && type !== "deployment.ready") {
    return NextResponse.json({ ok: true, ignored: type });
  }

  const p = body.payload || {};
  const dep = p.deployment || p || {};
  const depId = dep.id || dep.uid || p.deploymentId || "";
  const target = p.target || dep.target || "";
  const meta = dep.meta || p.meta || {};
  const sha = (meta.gitlabCommitSha || meta.githubCommitSha || "").slice(0, 7);
  const ref = meta.gitlabCommitRef || meta.githubCommitRef || "";
  const msg = (meta.gitlabCommitMessage || meta.githubCommitMessage || "").split("\n")[0].slice(0, 120);

  // Only staging (production-target = main branch deploy on edu.intelliverify.in)
  if (target && target !== "production") return NextResponse.json({ ok: true, skipped: "non-production" });
  if (!depId) return NextResponse.json({ ok: true, skipped: "no deployment id" });

  const db = sb();
  // Dedupe — don't create twice for the same deployment
  const { data: existing } = await db.from("qa_releases").select("id").eq("deployment_id", depId).maybeSingle();
  if (existing) return NextResponse.json({ ok: true, already: true });

  const today = new Date().toISOString().slice(0, 10);
  await db.from("qa_releases").insert({
    kind: "web",
    version: `web-${today}${sha ? `-${sha}` : ""}`,
    commit_sha: sha || null,
    deployment_id: depId,
    title: msg || `Staging deploy${ref ? ` (${ref})` : ""}`,
    status: "pending",
    staging_url: "https://edu.intelliverify.in",
    notes: "Auto-created from Vercel deploy — verify on staging, then Approve to go live.",
  });
  return NextResponse.json({ ok: true, created: true });
}
