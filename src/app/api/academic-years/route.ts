// src/app/api/academic-years/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, key);
}

// GET — list all academic years, current first
export async function GET() {
  try {
    const { data, error } = await getSupabase()
      .from("academic_years")
      .select("*")
      .order("start_date", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — create new academic year
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { label, start_date, end_date } = body;
    if (!label || !start_date || !end_date)
      return NextResponse.json({ error: "label, start_date, end_date required" }, { status: 400 });

    const { data, error } = await getSupabase()
      .from("academic_years")
      .insert({ label, start_date, end_date, is_current: false })
      .select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH — set as current OR rollover children to new year
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const sb = getSupabase();

    // Set a year as current
    if (body.action === "set_current") {
      const { id } = body;
      // Unset all current
      await sb.from("academic_years").update({ is_current: false }).neq("id", id);
      // Set new current
      const { error } = await sb.from("academic_years").update({ is_current: true }).eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // Rollover: move enrolled children from old year → new year (all)
    if (body.action === "rollover") {
      const { from_year_id, to_year_id } = body;
      // Get the IDs of children being rolled over so we can clear their kit
      const { data: toRollover } = await sb.from("enquiries")
        .select("id")
        .eq("academic_year_id", from_year_id)
        .eq("status", "enrolled");
      const { error } = await sb.from("enquiries")
        .update({ academic_year_id: to_year_id, section_id: null, section_name: null })
        .eq("academic_year_id", from_year_id)
        .eq("status", "enrolled");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      // Clear kit so they appear as "No Kit" in new year
      if (toRollover?.length) {
        await sb.from("child_kit").delete().in("enquiry_id", toRollover.map((r:any) => r.id));
      }
      return NextResponse.json({ success: true });
    }

    // Rollover selected: move specific children by IDs to a new year
    if (body.action === "rollover_selected") {
      const { enquiry_ids, to_year_id } = body;
      if (!enquiry_ids?.length || !to_year_id)
        return NextResponse.json({ error: "enquiry_ids and to_year_id required" }, { status: 400 });
      // Move children to new year, clear section
      const { error } = await sb.from("enquiries")
        .update({ academic_year_id: to_year_id, section_id: null, section_name: null })
        .in("id", enquiry_ids);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      // Clear kit items so children appear as "No Kit" in new year
      await sb.from("child_kit").delete().in("enquiry_id", enquiry_ids);
      return NextResponse.json({ success: true, count: enquiry_ids.length });
    }

    // Bulk status update
    if (body.action === "bulk_status") {
      const { enquiry_ids, status } = body;
      if (!enquiry_ids?.length || !status)
        return NextResponse.json({ error: "enquiry_ids and status required" }, { status: 400 });
      const { error } = await sb.from("enquiries")
        .update({ status })
        .in("id", enquiry_ids);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, count: enquiry_ids.length });
    }

    // Bulk section assign
    if (body.action === "bulk_section") {
      const { enquiry_ids, section_id, section_name } = body;
      if (!enquiry_ids?.length)
        return NextResponse.json({ error: "enquiry_ids required" }, { status: 400 });
      const { error } = await sb.from("enquiries")
        .update({ section_id: section_id || null, section_name: section_name || null })
        .in("id", enquiry_ids);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, count: enquiry_ids.length });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — remove academic year (only if no children linked)
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    const sb = getSupabase();
    // Check if children are linked
    const { count } = await sb.from("enquiries")
      .select("id", { count: "exact", head: true })
      .eq("academic_year_id", id);
    if (count && count > 0)
      return NextResponse.json({ error: `Cannot delete — ${count} children linked to this year.` }, { status: 400 });
    const { error } = await sb.from("academic_years").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
