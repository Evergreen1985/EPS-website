import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, phone, email, city, experience, qualification,
      age_groups, prev_school, available_from,
      audio_base64, audio_duration_seconds,
    } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "name and phone are required" }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("teacher_applications")
      .insert({
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        city: city?.trim() || null,
        experience: experience || null,
        qualification: qualification || null,
        age_groups: age_groups || [],
        prev_school: prev_school?.trim() || null,
        available_from: available_from || null,
        audio_base64: audio_base64 || null,
        audio_duration_seconds: audio_duration_seconds || null,
        status: "new",
        submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("teacher-apply insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err: any) {
    console.error("teacher-apply error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
