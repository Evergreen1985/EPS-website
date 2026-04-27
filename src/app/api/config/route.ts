import { NextResponse } from "next/server";

// Expose public config to client safely
export async function GET() {
  return NextResponse.json({
    supabaseUrl:  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    supabaseKey:  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  });
}
