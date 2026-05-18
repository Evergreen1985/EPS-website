import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySession, COOKIE_NAME } from "@/lib/adminSession";

export const dynamic = "force-dynamic";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value ?? "";
  const session = await verifySession(token);
  if (!session) return NextResponse.json({ permissions: null });

  // Full admins (admin_accounts) have no permissions in JWT → null = all tabs
  if (!session.permissions) return NextResponse.json({ permissions: null });

  // Restricted staff: do a live DB lookup so role permission changes take effect
  // without requiring a re-login. The role name is always baked into the JWT.
  if (session.role) {
    const { data } = await sb()
      .from("staff_roles")
      .select("permissions")
      .eq("name", session.role)
      .maybeSingle();

    if (data?.permissions) {
      const adminTabs = (data.permissions as string[]).filter((p: string) => !p.startsWith("td:"));
      return NextResponse.json({ permissions: adminTabs });
    }
  }

  // Fallback to JWT-embedded permissions if DB lookup fails
  return NextResponse.json({ permissions: session.permissions });
}
