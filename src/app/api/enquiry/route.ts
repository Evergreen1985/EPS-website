import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Only save to DB if Supabase is configured
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const { createClient } = await import("@supabase/supabase-js");
      const sb = createClient(supabaseUrl, supabaseKey);
      const { error } = await sb.from("enquiries").insert({
        child_name:       body.childName,
        child_dob:        body.dob,
        child_age_months: body.ageMonths,
        phone:            body.phone,
        parent_name:      body.parentName || null,
        address:          body.address || null,
        program_id:       body.program || null,
        program_label:    body.programLabel || null,
        language:         body.lang || "en-IN",
        source:           "website",
        status:           "new",
      });
      if (error) console.error("Supabase insert error:", error);
    } else {
      // Log to console if no DB configured yet
      console.log("📋 New Enquiry (no DB configured):", body);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Enquiry API error:", e);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
