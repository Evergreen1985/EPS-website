import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

// Teacher sends a message to owner
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { from_teacher_id, from_teacher_name, from_section, subject, message } = body;

    if (!from_teacher_name || !subject || !message) {
      return NextResponse.json({ error: "from_teacher_name, subject, message required" }, { status: 400 });
    }

    const { data, error } = await sb()
      .from("owner_messages")
      .insert({
        from_teacher_id: from_teacher_id || null,
        from_teacher_name,
        from_section: from_section || null,
        subject,
        message,
        read_by_owner: false,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ message: data });
  } catch (e) {
    console.error("[teacher/messages POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Teacher views their own sent messages (and replies)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get("teacherId");
    const teacherName = searchParams.get("teacherName");

    let query = sb().from("owner_messages").select("*").order("created_at", { ascending: false });

    if (teacherId) {
      query = query.eq("from_teacher_id", teacherId);
    } else if (teacherName) {
      query = query.eq("from_teacher_name", teacherName);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ messages: data || [] });
  } catch (e) {
    console.error("[teacher/messages GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
