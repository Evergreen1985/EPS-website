import { NextResponse } from "next/server";

export async function GET() {
  // List ALL env var keys to see what's actually available
  const allKeys = Object.keys(process.env).filter(k => 
    k.includes("SUPA") || k.includes("supa") || k.includes("DB") || k.includes("URL")
  );
  
  return NextResponse.json({
    supabase_url:      process.env.SUPABASE_URL          ? "SET" : "missing",
    supabase_anon:     process.env.SUPABASE_ANON_KEY     ? "SET" : "missing",
    next_public_url:   process.env.NEXT_PUBLIC_SUPABASE_URL       ? "SET" : "missing",
    next_public_anon:  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY  ? "SET" : "missing",
    matching_keys:     allKeys,
    node_env:          process.env.NODE_ENV,
  });
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
      child_name:       body.childName,
      child_dob:        body.dob || null,
      child_age_months: body.ageMonths || null,
      phone:            body.phone,
      parent_name:      body.parentName || null,
      address:          body.address || null,
      program_id:       body.program || null,
      program_label:    body.programLabel || null,
      language:         body.lang || "en-IN",
      source:           "website",
      status:           "new",
    }).select();

    if (error) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.[0]?.id });

  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 });
  }
}
