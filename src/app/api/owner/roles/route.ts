import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

const ALL_ADMIN_TABS = [
  { key: "enquiries",    label: "📋 Enquiries"     },
  { key: "sections",     label: "🏫 Sections"       },
  { key: "calendar",     label: "📅 Calendar"       },
  { key: "photos",       label: "📸 Photos"         },
  { key: "fees",         label: "💰 Fees"           },
  { key: "staff",        label: "👩‍🏫 Staff"         },
  { key: "settings",     label: "⚙️ Settings"       },
  { key: "academic",     label: "🎓 Academic Year"  },
  { key: "import",       label: "📥 Import Data"    },
  { key: "kit",          label: "🎒 Kit Manager"    },
  { key: "announcements",label: "📢 Announcements"  },
  { key: "expenses",     label: "💸 Expenses"       },
  { key: "reports",      label: "📊 Reports"        },
  { key: "transport",    label: "🚌 Transport"      },
];

const ALL_TD_TABS = [
  { key: "td:attendance", label: "📅 Attendance" },
  { key: "td:homework",   label: "📚 Homework"   },
  { key: "td:students",   label: "👶 Students"   },
  { key: "td:photos",     label: "📸 Photos"     },
  { key: "td:kit",        label: "🎒 Kit"        },
  { key: "td:messages",   label: "💬 Messages"   },
];

const ALL_ADMIN_KEYS = ALL_ADMIN_TABS.map(t => t.key);
const ALL_TD_KEYS    = ALL_TD_TABS.map(t => t.key);

const DEFAULT_ROLES = [
  { name: "Teacher",       color: "#178F78", permissions: [...ALL_TD_KEYS] },
  { name: "Class Teacher", color: "#178F78", permissions: [...ALL_TD_KEYS, "enquiries", "calendar", "photos", "announcements"] },
  { name: "Coordinator",   color: "#6366F1", permissions: ["enquiries", "sections", "calendar", "announcements", "transport"] },
  { name: "Admin",         color: "#E8694A", permissions: [...ALL_TD_KEYS, ...ALL_ADMIN_KEYS] },
  { name: "Helper",        color: "#6366F1", permissions: [] },
  { name: "Driver",        color: "#F5B829", permissions: [] },
  { name: "Cook",          color: "#EC4899", permissions: [] },
  { name: "Security",      color: "#6B7280", permissions: [] },
];

export async function GET() {
  try {
    const client = sb();
    const { data, error } = await client
      .from("staff_roles")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;

    // Seed defaults if table is empty
    if (!data || data.length === 0) {
      const seeds = DEFAULT_ROLES.map((r, i) => ({ ...r, sort_order: i + 1 }));
      const { data: seeded } = await client.from("staff_roles").insert(seeds).select();
      return NextResponse.json({ roles: seeded || [], allAdminTabs: ALL_ADMIN_TABS, allTdTabs: ALL_TD_TABS });
    }

    return NextResponse.json({ roles: data, allAdminTabs: ALL_ADMIN_TABS, allTdTabs: ALL_TD_TABS });
  } catch (e) {
    console.error("[owner/roles GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, color, permissions } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

    const { data: existing } = await sb().from("staff_roles").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
    const sort_order = (existing?.sort_order || 0) + 1;

    const { data, error } = await sb()
      .from("staff_roles")
      .insert({ name: name.trim(), color: color || "#178F78", sort_order, permissions: Array.isArray(permissions) ? permissions : [] })
      .select().single();
    if (error) throw error;
    return NextResponse.json({ role: data });
  } catch (e) {
    console.error("[owner/roles POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, name, color, permissions } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const updates: any = {};
    if (name?.trim()) updates.name = name.trim();
    if (color) updates.color = color;
    if (Array.isArray(permissions)) updates.permissions = permissions;
    const { data, error } = await sb().from("staff_roles").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return NextResponse.json({ role: data });
  } catch (e) {
    console.error("[owner/roles PATCH]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const { error } = await sb().from("staff_roles").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[owner/roles DELETE]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
