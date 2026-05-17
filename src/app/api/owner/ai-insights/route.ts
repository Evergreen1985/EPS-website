import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

export async function GET() {
  try {
    const client = sb();
    const today = new Date().toISOString().split("T")[0];
    const thisMonth = new Date().toISOString().slice(0, 7);

    const [enquiriesRes, feesRes, attendanceRes, expensesRes, staffRes] = await Promise.all([
      client.from("enquiries").select("status, program_label, created_at"),
      client.from("fee_assignments").select("status, amount, paid_amount, due_date"),
      client.from("attendance").select("status, date").gte("date", `${thisMonth}-01`),
      client.from("expenses").select("category, amount, date").gte("date", `${thisMonth}-01`),
      client.from("staff").select("role, is_active"),
    ]);

    const enquiries = enquiriesRes.data || [];
    const fees = feesRes.data || [];
    const attendance = attendanceRes.data || [];
    const expenses = expensesRes.data || [];
    const staff = staffRes.data || [];

    const enrolled = enquiries.filter((e: any) => e.status === "enrolled").length;
    const newThisMonth = enquiries.filter((e: any) => e.created_at?.startsWith(thisMonth)).length;
    const pendingFees = fees.filter((f: any) => ["pending", "partial", "overdue"].includes(f.status));
    const pendingAmount = pendingFees.reduce((s: number, f: any) => s + (f.amount - (f.paid_amount || 0)), 0);
    const presentDays = attendance.filter((a: any) => a.status === "present" || a.status === "late").length;
    const totalAttDays = attendance.length;
    const expenseTotal = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);

    const statusBreakdown = enquiries.reduce((acc: any, e: any) => {
      acc[e.status] = (acc[e.status] || 0) + 1;
      return acc;
    }, {});

    const context = `
School Performance Data for ${thisMonth}:
- Total enquiries: ${enquiries.length} (${newThisMonth} new this month)
- Enrolled students: ${enrolled}
- Admissions status: ${JSON.stringify(statusBreakdown)}
- Pending fees: ₹${Math.round(pendingAmount)} across ${pendingFees.length} assignments
- Overdue fees: ${fees.filter((f: any) => f.status === "overdue").length} assignments
- Attendance rate this month: ${totalAttDays > 0 ? Math.round((presentDays / totalAttDays) * 100) : 0}%
- Total expenses this month: ₹${Math.round(expenseTotal)}
- Active staff: ${staff.filter((s: any) => s.is_active).length}
`;

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are an expert school management advisor for Evergreen Preschool & Daycare in India. Based on the following school performance data, provide 5-6 specific, actionable development suggestions to help the school grow and improve operations. Be practical, concise, and focused on a preschool context.\n\n${context}\n\nFormat your response as numbered suggestions with a brief title and 2-3 sentence explanation each.`,
        },
      ],
    });

    const insights = (response.content[0] as any).text || "";
    return NextResponse.json({ insights, generatedAt: new Date().toISOString() });
  } catch (e) {
    console.error("[owner/ai-insights]", e);
    return NextResponse.json({ error: "Could not generate insights" }, { status: 500 });
  }
}
