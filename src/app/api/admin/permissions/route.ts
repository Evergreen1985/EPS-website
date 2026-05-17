import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { verifySession } from "@/lib/adminSession";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("ep_admin_sid")?.value;
    if (!token) return NextResponse.json({ permissions: null });

    const session = await verifySession(token);
    if (!session) return NextResponse.json({ permissions: null });

    // Owner and built-in admin accounts get full unrestricted access
    if (session.role === "owner" || session.role === "admin") {
      return NextResponse.json({ permissions: null });
    }

    // Look up the role name in staff_roles to get its permissions
    const { data: roleRecord } = await sb()
      .from("staff_roles")
      .select("name, permissions")
      .ilike("name", session.role)
      .maybeSingle();

    if (!roleRecord) {
      // Role not found in staff_roles — grant full access as safe default
      return NextResponse.json({ permissions: null });
    }

    return NextResponse.json({ permissions: roleRecord.permissions || [] });
  } catch (e) {
    console.error("[admin/permissions GET]", e);
    return NextResponse.json({ permissions: null });
  }
}
