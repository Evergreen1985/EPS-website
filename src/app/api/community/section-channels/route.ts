import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PARENT_COOKIE_NAME, verifyParentSession } from "@/lib/parentSession";

export const dynamic = "force-dynamic";

function sb() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
}

export async function GET(req: NextRequest) {
  const parentToken = req.cookies.get(PARENT_COOKIE_NAME)?.value ?? "";
  if (!parentToken) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const session = await verifyParentSession(parentToken);
  if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  // Get section + AY from the child's enquiry
  const { data: enquiry } = await sb()
    .from("enquiries")
    .select("section_id, section_name, academic_year_id")
    .eq("id", session.enquiryId)
    .maybeSingle();

  if (!enquiry?.section_id) {
    return NextResponse.json({ error: "No section assigned yet" }, { status: 404 });
  }

  const { data: ay } = await sb()
    .from("academic_years")
    .select("label")
    .eq("id", enquiry.academic_year_id)
    .maybeSingle();

  const ayLabel     = ay?.label     ?? "Current Year";
  const sectionName = enquiry.section_name ?? "My Section";
  const childSlug   = `sect_child_${enquiry.section_id}`;
  const parentSlug  = `sect_parent_${enquiry.section_id}`;

  // Auto-provision both channels (no-op if already exist)
  await sb().from("community_channels").upsert([
    {
      slug:        childSlug,
      name:        `${sectionName} · Children`,
      description: `${ayLabel} — ${sectionName} children's chat`,
      icon:        "👶",
      access:      "parents_staff",
      sort_order:  100,
      is_active:   true,
    },
    {
      slug:        parentSlug,
      name:        `${sectionName} · Parents`,
      description: `${ayLabel} — ${sectionName} parents' chat`,
      icon:        "👪",
      access:      "parents",
      sort_order:  101,
      is_active:   true,
    },
  ], { onConflict: "slug", ignoreDuplicates: true });

  const { data: channels } = await sb()
    .from("community_channels")
    .select("*")
    .in("slug", [childSlug, parentSlug]);

  const childChannel  = (channels ?? []).find((c: any) => c.slug === childSlug);
  const parentChannel = (channels ?? []).find((c: any) => c.slug === parentSlug);

  if (!childChannel || !parentChannel) {
    return NextResponse.json({ error: "Failed to provision section channels" }, { status: 500 });
  }

  return NextResponse.json({
    childChannel:  { ...childChannel,  message_count: 0 },
    parentChannel: { ...parentChannel, message_count: 0 },
    sectionName,
    ayLabel,
    childName: session.childName,
  });
}
