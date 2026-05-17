import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

// Tables that are allowed to be cleaned — admin_accounts is NEVER in this list
// Only admin_accounts is NEVER deletable — everything else is owner's choice
const ALLOWED_TABLES: Record<string, { label: string; description: string }> = {
  enquiries:        { label: "Enquiries / Children",    description: "All student and enquiry records (enrolled, pending, etc.)" },
  attendance:       { label: "Children Attendance",     description: "All daily attendance records" },
  fee_assignments:  { label: "Fee Assignments",         description: "All fee records including paid/collected fees" },
  homework:         { label: "Homework",                description: "All homework assignments" },
  announcements:    { label: "Announcements",           description: "All school announcements" },
  calendar_events:  { label: "Calendar Events",         description: "All calendar events" },
  sections:         { label: "Sections / Classes",      description: "All classroom / section records" },
  section_photos:   { label: "Section Photos",          description: "All classroom photo records" },
  child_documents:  { label: "Child Documents",         description: "All uploaded child documents" },
  child_kit:        { label: "Kit Records",             description: "All kit issue records per child" },
  expenses:         { label: "Expenses",                description: "All expense entries" },
  staff:            { label: "Staff Directory",         description: "All staff records" },
  staff_attendance: { label: "Staff Attendance",        description: "All staff clock-in/out records" },
  staff_roles:      { label: "Staff Roles",             description: "All custom staff role definitions" },
  programmes:       { label: "Programmes",              description: "All programme definitions (Nursery, JrKG, etc.)" },
  teacher_accounts: { label: "Teacher Accounts",        description: "All teacher login credentials" },
  parent_accounts:  { label: "Parent Accounts",         description: "All parent login credentials" },
  owner_messages:   { label: "Owner Messages",          description: "All teacher-to-owner messages" },
  password_resets:  { label: "Password Resets",         description: "All OTP / password reset records" },
};

// Safe deletion order — child/dependent tables must be deleted BEFORE their parents.
// fee_assignments.enquiry_id → enquiries, attendance → enquiries, etc.
// Violating this order causes FK constraint errors and silently leaves data intact.
const DELETION_ORDER = [
  "fee_assignments",   // references enquiries
  "attendance",        // references enquiries
  "child_documents",   // references enquiries
  "child_kit",         // references enquiries
  "section_photos",    // references sections
  "homework",          // references sections
  "staff_attendance",  // references staff
  "calendar_events",
  "announcements",
  "owner_messages",
  "password_resets",
  "expenses",
  "teacher_accounts",
  "parent_accounts",
  "enquiries",         // parent — must come after all child tables above
  "staff",             // parent — after staff_attendance
  "sections",          // parent — after section_photos, homework
  "staff_roles",
  "programmes",
];

export async function GET() {
  const client = sb();
  const counts: Record<string, number> = {};
  const errors: Record<string, string> = {};

  await Promise.all(
    Object.keys(ALLOWED_TABLES).map(async (t) => {
      // Use a plain select (same as all other working APIs) — head:true behaves
      // differently under Supabase RLS and returns 0 even when rows exist
      const { data, error } = await client.from(t).select("id");
      if (error) {
        console.error(`[cleanup count] ${t}:`, error.message);
        errors[t] = error.message;
        counts[t] = 0;
      } else {
        counts[t] = data?.length ?? 0;
      }
    })
  );

  return NextResponse.json({ tables: ALLOWED_TABLES, counts, errors });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tables, confirm } = body;

    if (confirm !== "DELETE") {
      return NextResponse.json({ error: "Confirmation text does not match" }, { status: 400 });
    }

    if (!Array.isArray(tables) || tables.length === 0) {
      return NextResponse.json({ error: "No tables selected" }, { status: 400 });
    }

    // Reject any table not in the allowed list — safety guard
    const invalid = tables.filter((t: string) => !ALLOWED_TABLES[t]);
    if (invalid.length > 0) {
      return NextResponse.json({ error: `Not allowed to delete: ${invalid.join(", ")}` }, { status: 403 });
    }

    const client = sb();
    const results: Record<string, { deleted: number; error?: string }> = {};

    // Sort selected tables into safe FK-aware deletion order
    const ordered = [
      ...DELETION_ORDER.filter(t => tables.includes(t)),
      ...tables.filter(t => !DELETION_ORDER.includes(t)), // any unlisted tables go last
    ];

    for (const table of ordered) {
      try {
        // Delete all rows — Supabase requires at least one filter, so we use a
        // neq on the zero UUID which never matches any real row (all ids are non-zero)
        const { error, count } = await client
          .from(table)
          .delete({ count: "exact" })
          .neq("id", "00000000-0000-0000-0000-000000000000");

        if (error) {
          results[table] = { deleted: 0, error: error.message };
        } else {
          results[table] = { deleted: count || 0 };
        }
      } catch (e: any) {
        results[table] = { deleted: 0, error: e.message };
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (e) {
    console.error("[owner/cleanup]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
