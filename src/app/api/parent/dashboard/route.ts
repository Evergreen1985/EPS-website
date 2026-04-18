import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");
  if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 400 });

  const client = sb();

  const { data: enquiries } = await client
    .from("enquiries")
    .select("id, child_name, child_dob, child_age_months, program_label, program_id, status, created_at")
    .eq("phone", phone.trim())
    .order("created_at", { ascending: false });

  const { data: announcements } = await client
    .from("announcements")
    .select("*")
    .or("target.eq.all,target.eq.parents")
    .order("created_at", { ascending: false })
    .limit(5);

  return NextResponse.json({
    enquiries:     enquiries     || [],
    announcements: announcements || [],
  });
}
