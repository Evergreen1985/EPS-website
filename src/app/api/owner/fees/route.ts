import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

export async function GET() {
  try {
    const { data, error } = await sb()
      .from("fee_assignments")
      .select("id, child_name, fee_type, amount, paid_amount, status, due_date, period_label, payment_date, payment_mode")
      .order("due_date", { ascending: true });

    if (error) throw error;

    const assignments = data || [];
    const pending = assignments.filter((f: any) => ["pending", "partial", "overdue"].includes(f.status));
    const paid = assignments.filter((f: any) => f.status === "paid");

    return NextResponse.json({ pending, paid, all: assignments });
  } catch (e) {
    console.error("[owner/fees GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
