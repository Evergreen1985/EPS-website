// src/app/api/kit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, key);
}

// GET /api/kit?enquiryId=xxx  — fetch child's kit checklist
// GET /api/kit?programmeId=xxx — fetch programme templates
export async function GET(req: NextRequest) {
  try {
    const enquiryId   = req.nextUrl.searchParams.get("enquiryId");
    const programmeId = req.nextUrl.searchParams.get("programmeId");

    if (enquiryId) {
      const { data, error } = await sb()
        .from("child_kit")
        .select("*")
        .eq("enquiry_id", enquiryId)
        .order("item_category")
        .order("created_at");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data ?? []);
    }

    if (programmeId) {
      const { data, error } = await sb()
        .from("programme_items")
        .select("*")
        .eq("programme_id", programmeId)
        .eq("is_active", true)
        .order("sort_order");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data ?? []);
    }

    return NextResponse.json({ error: "enquiryId or programmeId required" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/kit — create kit for child from programme template OR add custom item
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // action: "init" — create checklist from programme template for a child
    if (action === "init") {
      const { enquiry_id, child_name, programme_id, academic_year_id } = body;
      // Get programme template items
      const { data: templates } = await sb()
        .from("programme_items")
        .select("*")
        .eq("programme_id", programme_id)
        .eq("is_active", true)
        .order("sort_order");

      if (!templates?.length) return NextResponse.json({ success: true, count: 0, message: "No template items for this programme" });

      // Check if already initialized
      const { count } = await sb()
        .from("child_kit")
        .select("id", { count: "exact", head: true })
        .eq("enquiry_id", enquiry_id);

      if (count && count > 0) return NextResponse.json({ success: true, count, message: "Already initialized" });

      const rows = templates.map((t: any) => ({
        enquiry_id,
        child_name,
        programme_id,
        academic_year_id: academic_year_id || null,
        programme_item_id: t.id,
        item_name:     t.item_name,
        item_category: t.item_category,
        quantity:      t.quantity,
        issued:        false,
        created_at:    new Date().toISOString(),
        updated_at:    new Date().toISOString(),
      }));

      const { error } = await sb().from("child_kit").insert(rows);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, count: rows.length });
    }

    // action: "add" — add a custom item to a child's kit
    if (action === "add") {
      const { enquiry_id, child_name, programme_id, item_name, item_category, quantity, size } = body;
      const { data, error } = await sb()
        .from("child_kit")
        .insert({ enquiry_id, child_name, programme_id, item_name, item_category: item_category || "other", quantity: quantity || 1, size: size || null, issued: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, data });
    }

    // action: "add_template" — add item to programme template
    if (action === "add_template") {
      const { programme_id, item_name, item_category, quantity, notes } = body;
      const { data, error } = await sb()
        .from("programme_items")
        .insert({ programme_id, item_name, item_category: item_category || "book", quantity: quantity || 1, notes, created_at: new Date().toISOString() })
        .select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/kit — update item (issue, parent comment, notes)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    let updates: any = { updated_at: new Date().toISOString() };

    if (action === "issue") {
      updates = { ...updates, issued: true, issued_date: body.issued_date || new Date().toISOString().split("T")[0], issued_by: body.issued_by, issued_by_role: body.issued_by_role || "admin", school_notes: body.school_notes || null };
    } else if (action === "unissue") {
      updates = { ...updates, issued: false, issued_date: null, issued_by: null, issued_by_role: null };
    } else if (action === "parent_comment") {
      updates = { ...updates, parent_comment: body.parent_comment };
    } else if (action === "acknowledge") {
      updates = { ...updates, parent_acknowledged: true, parent_acknowledged_at: new Date().toISOString() };
    } else if (action === "update_notes") {
      updates = { ...updates, school_notes: body.school_notes, size: body.size || null };
    }

    const { data, error } = await sb().from("child_kit").update(updates).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/kit — remove item from child kit or template
export async function DELETE(req: NextRequest) {
  try {
    const { id, from } = await req.json();
    const table = from === "template" ? "programme_items" : "child_kit";
    const { error } = await sb().from(table).delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
