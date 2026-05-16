// src/app/api/kit/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, key);
}

// POST /api/kit/bulk
// action: "init_bulk"  — create kit items for multiple children with selected items
// action: "issue_bulk" — mark specific item types as issued for multiple children
// action: "status"     — get kit status summary for multiple children
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // ── Get kit status for a list of children ─────────────────────────────────
    if (action === "status") {
      const { enquiry_ids } = body;
      if (!enquiry_ids?.length) return NextResponse.json([]);
      const { data, error } = await sb()
        .from("child_kit")
        .select("enquiry_id, item_category, issued, item_name")
        .in("enquiry_id", enquiry_ids);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      // Summarise per child
      const summary: Record<string, { total: number; issued: number; categories: Record<string, boolean> }> = {};
      (data || []).forEach((row: any) => {
        if (!summary[row.enquiry_id]) summary[row.enquiry_id] = { total: 0, issued: 0, categories: {} };
        summary[row.enquiry_id].total++;
        if (row.issued) {
          summary[row.enquiry_id].issued++;
          summary[row.enquiry_id].categories[row.item_category] = true;
        }
      });
      return NextResponse.json(summary);
    }

    // ── Bulk init: create kit rows for multiple children ──────────────────────
    if (action === "init_bulk") {
      const { children, selected_items, issued_by, issue_immediately, academic_year_id } = body;
      // children: [{ enquiry_id, child_name, programme_id }]
      // selected_items: [{ item_name, item_category, quantity }]

      const results: any[] = [];
      for (const child of children) {
        // Skip items that child already has
        const { data: existing } = await sb()
          .from("child_kit")
          .select("item_name")
          .eq("enquiry_id", child.enquiry_id);
        const existingNames = new Set((existing || []).map((e: any) => e.item_name));

        const toInsert = selected_items
          .filter((item: any) => !existingNames.has(item.item_name))
          .map((item: any) => ({
            enquiry_id:       child.enquiry_id,
            child_name:       child.child_name,
            programme_id:     child.programme_id,
            academic_year_id: academic_year_id || null,
            item_name:        item.item_name,
            item_category:    item.item_category,
            quantity:         item.quantity || 1,
            issued:           issue_immediately ? true : false,
            issued_date:      issue_immediately ? new Date().toISOString().split("T")[0] : null,
            issued_by:        issue_immediately ? issued_by : null,
            issued_by_role:   issue_immediately ? "admin" : null,
            created_at:       new Date().toISOString(),
            updated_at:       new Date().toISOString(),
          }));

        if (toInsert.length > 0) {
          const { error } = await sb().from("child_kit").insert(toInsert);
          results.push({ enquiry_id: child.enquiry_id, child_name: child.child_name, added: toInsert.length, error: error?.message });
        } else {
          results.push({ enquiry_id: child.enquiry_id, child_name: child.child_name, added: 0, skipped: true });
        }
      }
      return NextResponse.json({ success: true, results });
    }

    // ── Bulk issue: mark existing items as issued for multiple children ────────
    if (action === "issue_bulk") {
      const { enquiry_ids, item_categories, issued_by } = body;
      const { error } = await sb()
        .from("child_kit")
        .update({ issued: true, issued_date: new Date().toISOString().split("T")[0], issued_by, issued_by_role: "admin", updated_at: new Date().toISOString() })
        .in("enquiry_id", enquiry_ids)
        .in("item_category", item_categories)
        .eq("issued", false);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
