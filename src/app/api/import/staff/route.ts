// src/app/api/import/staff/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, key);
}

function clean(v: any) {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

export async function POST(req: NextRequest) {
  try {
    const { rows } = await req.json();
    if (!Array.isArray(rows) || rows.length === 0)
      return NextResponse.json({ error: "No rows provided" }, { status: 400 });

    const sb = getSupabase();
    const results = { success: 0, failed: 0, errors: [] as string[] };
    const validRoles = ["Teacher","Class Teacher","Admin","Helper","Driver","Cook","Security"];

    for (let i = 0; i < rows.length; i++) {
      const row    = rows[i];
      const rowNum = i + 2;
      const name   = clean(row.name);

      if (!name) {
        results.failed++;
        results.errors.push(`Row ${rowNum}: Name is required`);
        continue;
      }

      const role = clean(row.role) || "Teacher";
      const record: any = {
        name,
        role:             validRoles.includes(role) ? role : "Teacher",
        phone:            clean(row.phone),
        email:            clean(row.email),
        dob:              clean(row.dob),
        join_date:        clean(row.join_date),
        last_working_day: clean(row.last_working_day),
        address:          clean(row.address),
        notes:            clean(row.notes),
        is_active:        true,
        created_at:       new Date().toISOString(),
      };

      const { error } = await sb.from("staff").insert(record);
      if (error) {
        results.failed++;
        results.errors.push(`Row ${rowNum} (${name}): ${error.message}`);
      } else {
        results.success++;
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
