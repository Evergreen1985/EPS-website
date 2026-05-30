import pg from "pg";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

const PROJECT_REF = "mmznugcbwbjeqnmmwmxn";
const DB_PASS     = process.env.DB_PASS || "Evergreen@2025";

const configs = [
  {
    label: "AP-Southeast-1 (Singapore) session",
    host: `aws-0-ap-southeast-1.pooler.supabase.com`,
    port: 5432,
    database: "postgres",
    user: `postgres.${PROJECT_REF}`,
    password: DB_PASS,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  },
  {
    label: "AP-Southeast-1 (Singapore) transaction",
    host: `aws-0-ap-southeast-1.pooler.supabase.com`,
    port: 6543,
    database: "postgres",
    user: `postgres.${PROJECT_REF}`,
    password: DB_PASS,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  },
  {
    label: "AP-South-1 (Mumbai) session",
    host: `aws-0-ap-south-1.pooler.supabase.com`,
    port: 5432,
    database: "postgres",
    user: `postgres.${PROJECT_REF}`,
    password: DB_PASS,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  },
  {
    label: "AP-South-1 (Mumbai) transaction",
    host: `aws-0-ap-south-1.pooler.supabase.com`,
    port: 6543,
    database: "postgres",
    user: `postgres.${PROJECT_REF}`,
    password: DB_PASS,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  },
  {
    label: "Direct DB",
    host: `db.${PROJECT_REF}.supabase.co`,
    port: 5432,
    database: "postgres",
    user: "postgres",
    password: DB_PASS,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  },
];

const sql = readFileSync(
  join(__dirname, "../supabase/migrations/002_kb_audio_schema.sql"),
  "utf-8"
);

for (const cfg of configs) {
  console.log(`\nTrying: ${cfg.label} (${cfg.host}:${cfg.port})...`);
  const client = new Client(cfg);
  try {
    await client.connect();
    console.log("✅ Connected!");
    await client.query(sql);
    console.log("✅ Migration complete — tables + function created!");
    await client.query(`
      insert into storage.buckets (id, name, public)
      values ('audio-overviews', 'audio-overviews', true)
      on conflict do nothing;
    `);
    console.log("✅ Storage bucket 'audio-overviews' created!");
    await client.end();
    process.exit(0);
  } catch (e) {
    console.log(`❌ Failed: ${e.message}`);
    try { await client.end(); } catch {}
  }
}

console.log("\n❌ All connection attempts failed.");
console.log("Please reset your DB password at:");
console.log(`https://supabase.com/dashboard/project/${PROJECT_REF}/settings/database`);
