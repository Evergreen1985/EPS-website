import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { verifyOwnerSession, OWNER_COOKIE_NAME } from "@/lib/ownerSession";

export const dynamic = "force-dynamic";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

async function requireOwner() {
  const token = (await cookies()).get(OWNER_COOKIE_NAME)?.value;
  return token ? await verifyOwnerSession(token) : null;
}

// List all test logs (founder dashboard)
export async function GET() {
  if (!(await requireOwner())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await sb()
    .from("qa_test_logs")
    .select("*")
    .order("area", { ascending: true })
    .order("feature", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ logs: data || [] });
}

// Insert or update a log entry (e.g. flip status to fixed)
export async function POST(req: NextRequest) {
  if (!(await requireOwner())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { id, ...fields } = body;
  if (id) {
    const patch = { ...fields, updated_at: new Date().toISOString() };
    if (fields.status === "fixed" && !fields.fixed_at) patch.fixed_at = new Date().toISOString();
    const { error } = await sb().from("qa_test_logs").update(patch).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await sb().from("qa_test_logs").insert(fields);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// Clear all logs (founder cleanup once sign-off is given)
export async function DELETE() {
  if (!(await requireOwner())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { error } = await sb().from("qa_test_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
