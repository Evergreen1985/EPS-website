import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return NextResponse.json({
    hasUrl:  !!url,
    hasKey:  !!key,
    urlHint: url ? url.slice(0, 30) + "..." : "NOT SET",
  });
}

export async function POST(req: Request) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  try {
    const body = await req.json();
    console.log("📋 Enquiry received:", body.childName, body.phone);

    if (!url || !key) {
      console.error("❌ Missing Supabase env vars — hasUrl:", !!url, "hasKey:", !!key);
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
      console.error("❌ Supabase error:", JSON.stringify(error));
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: 500 });
    }

    console.log("✅ Enquiry saved:", data?.[0]?.id);
    return NextResponse.json({ success: true, id: data?.[0]?.id });

  } catch (e: any) {
    console.error("❌ API crash:", e?.message);
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 });
  }
}


  try {
    const body = await req.json();
    console.log("📋 Enquiry received:", body.childName, body.phone);

    if (!url || !key) {
      console.error("❌ Missing Supabase env vars — hasUrl:", !!url, "hasKey:", !!key);
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
      console.error("❌ Supabase error:", JSON.stringify(error));
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: 500 });
    }

    console.log("✅ Enquiry saved to DB:", data?.[0]?.id);
    return NextResponse.json({ success: true, id: data?.[0]?.id });

  } catch (e: any) {
    console.error("❌ API crash:", e?.message);
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 });
  }
}
