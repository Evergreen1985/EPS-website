/**
 * Migration runner — uses Supabase Management API.
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/run-migration.mjs
 *
 * Get your access token at: https://supabase.com/dashboard/account/tokens
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = "mmznugcbwbjeqnmmwmxn";

const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error("❌ SUPABASE_ACCESS_TOKEN is not set.");
  console.error("   Get it at: https://supabase.com/dashboard/account/tokens");
  console.error("   Then run:");
  console.error("   $env:SUPABASE_ACCESS_TOKEN='sbp_xxx'; node scripts/run-migration.mjs");
  process.exit(1);
}

const sql = readFileSync(
  join(__dirname, "../supabase/migrations/002_kb_audio_schema.sql"),
  "utf-8"
);

// Split on semicolons, filter blanks and comments-only blocks
const statements = sql
  .split(/;\s*\n/)
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith("--"));

console.log(`Running ${statements.length} SQL statements against project ${PROJECT_REF}...`);

let ok = 0, failed = 0;

for (const stmt of statements) {
  const full = stmt.endsWith(";") ? stmt : stmt + ";";
  try {
    const res = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ query: full }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      const msg = data?.message || JSON.stringify(data);
      if (msg.includes("already exists") || msg.includes("duplicate")) {
        console.log(`  ⚠️  Already exists (skip): ${full.slice(0, 60)}...`);
        ok++;
      } else {
        console.error(`  ❌ Failed: ${msg}`);
        console.error(`     SQL: ${full.slice(0, 120)}`);
        failed++;
      }
    } else {
      console.log(`  ✅ OK: ${full.slice(0, 70).replace(/\n/g, " ")}...`);
      ok++;
    }
  } catch (e) {
    console.error(`  ❌ Network error: ${e.message}`);
    failed++;
  }
}

console.log(`\nDone. ${ok} succeeded, ${failed} failed.`);
if (failed === 0) {
  console.log("✅ Migration complete! Now create the Supabase Storage bucket:");
  console.log("   Dashboard → Storage → New Bucket → Name: audio-overviews → Public: YES");
}
