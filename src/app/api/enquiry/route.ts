import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: "env vars missing" });
  }

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(url, key);

    // Try a direct test insert
    const { data, error } = await sb.from("enquiries").insert({
      child_name:    "API Test",
      phone:         "0000000000",
      source:        "api-test",
      status:        "new",
      language:      "en-IN",
    }).select();

    return NextResponse.json({
      success: !error,
      data,
      error: error ? { msg: error.message, code: error.code, details: error.details, hint: error.hint } : null,
      url_hint: url.slice(0, 30),
    });
  } catch (e: any) {
    return NextResponse.json({ crash: e?.message });
  }
}

export async function POST(req: Request) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  try {
    const body = await req.json();

    if (!url || !key) {
      return NextResponse.json({ success: false, error: "DB not configured" }, { status: 500 });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(url, key);

    const { data, error } = await sb.from("enquiries").insert({
      child_name:       body.childName?.trim() || "Unknown",
      child_dob:        body.dob || null,
      child_age_months: body.ageMonths || null,
      phone:            body.phone?.trim() || "0000000000",
      parent_name:      body.parentName?.trim() || null,
      address:          body.address?.trim() || null,
      program_id:       body.program || null,
      program_label:    body.programLabel || null,
      language:         body.lang || "en-IN",
      source:           "website",
      status:           "new",
    }).select();

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.[0]?.id });

  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 });
  }
}
