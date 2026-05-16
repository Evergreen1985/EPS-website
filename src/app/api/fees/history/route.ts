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
  const enquiryId = searchParams.get("enquiryId");
  if (!enquiryId) return NextResponse.json([], { status: 200 });

  const { data, error } = await sb()
    .from("fee_assignments")
    .select("*")
    .eq("enquiry_id", enquiryId)
    .in("status", ["paid", "partial", "waived"])
    .order("payment_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}
