// src/app/api/import/students/route.ts
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
    const { data: yearData } = await sb.from("academic_years").select("id").eq("is_current", true).single();
    const currentYearId = yearData?.id || null;

    const results = { success: 0, failed: 0, errors: [] as string[] };
    const validStatuses = ["new","called","visited","enrolled","not-interested"];

    for (let i = 0; i < rows.length; i++) {
      const row    = rows[i];
      const rowNum = i + 2;
      const child_name = clean(row.child_name);

      if (!child_name) {
        results.failed++;
        results.errors.push(`Row ${rowNum}: Child Name is required`);
        continue;
      }

      const status = clean(row.status) || "new";
      const record: any = {
        child_name,
        child_dob:        clean(row.child_dob),
        program_label:    clean(row.program_label) || "Not specified",
        status:           validStatuses.includes(status) ? status : "new",
        father_name:      clean(row.father_name),
        mother_name:      clean(row.mother_name),
        phone:            clean(row.phone) || clean(row.father_phone),
        father_phone:     clean(row.father_phone) || clean(row.phone),
        mother_phone:     clean(row.mother_phone),
        guardian_phone:   clean(row.guardian_phone),
        email:            clean(row.email),
        address:          clean(row.address),
        blood_group:      clean(row.blood_group),
        allergies:        clean(row.allergies),
        notes:            clean(row.notes),
        academic_year_id: currentYearId,
        created_at:       new Date().toISOString(),
      };

      const { error } = await sb.from("enquiries").insert(record);
      if (error) {
        results.failed++;
        results.errors.push(`Row ${rowNum} (${child_name}): ${error.message}`);
      } else {
        results.success++;
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
