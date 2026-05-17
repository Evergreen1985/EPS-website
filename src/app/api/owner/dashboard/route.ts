import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

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

    const [
      enquiriesRes,
      feesRes,
      attendanceRes,
      staffRes,
      messagesRes,
      kitsRes,
      expensesRes,
    ] = await Promise.all([
      client.from("enquiries").select("id, status, program_label, created_at"),
      client.from("fee_assignments").select("id, status, amount, paid_amount"),
      client.from("attendance").select("id, status, date").eq("date", today),
      client.from("staff").select("id, name, role, is_active").eq("is_active", true),
      client.from("owner_messages").select("id, read_by_owner").eq("read_by_owner", false),
      client.from("child_kit").select("id, parent_acknowledged, issued"),
      client.from("expenses").select("id, amount, category, date"),
    ]);

    const enquiries = enquiriesRes.data || [];
    const fees = feesRes.data || [];
    const attendance = attendanceRes.data || [];
    const staff = staffRes.data || [];
    const unreadMessages = messagesRes.data || [];
    const kits = kitsRes.data || [];
    const expenses = expensesRes.data || [];

    // Admissions breakdown
    const admissionsBreakdown = enquiries.reduce((acc: Record<string, number>, e: any) => {
      acc[e.status] = (acc[e.status] || 0) + 1;
      return acc;
    }, {});

    // Program breakdown (enrolled only)
    const enrolled = enquiries.filter((e: any) => e.status === "enrolled");
    const programBreakdown = enrolled.reduce((acc: Record<string, number>, e: any) => {
      acc[e.program_label || "Unknown"] = (acc[e.program_label || "Unknown"] || 0) + 1;
      return acc;
    }, {});

    // Fees summary
    const pendingFees = fees.filter((f: any) => f.status === "pending" || f.status === "partial" || f.status === "overdue");
    const pendingAmount = pendingFees.reduce((sum: number, f: any) => sum + (f.amount - (f.paid_amount || 0)), 0);
    const overdueCount = fees.filter((f: any) => f.status === "overdue").length;

    // Today's attendance rate
    const presentToday = attendance.filter((a: any) => a.status === "present" || a.status === "late").length;
    const totalAttendance = attendance.length;

    // Kits pending acknowledgment
    const kitsPendingAck = kits.filter((k: any) => k.issued && !k.parent_acknowledged).length;

    // This month's expenses
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthExpenses = expenses.filter((e: any) => e.date && e.date.startsWith(thisMonth));
    const monthExpenseTotal = monthExpenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);

    return NextResponse.json({
      admissions: {
        total: enquiries.length,
        enrolled: enrolled.length,
        breakdown: admissionsBreakdown,
        programBreakdown,
        thisMonth: enquiries.filter((e: any) => e.created_at && e.created_at.startsWith(thisMonth)).length,
      },
      fees: {
        pendingCount: pendingFees.length,
        pendingAmount: Math.round(pendingAmount),
        overdueCount,
      },
      attendance: {
        presentToday,
        totalToday: totalAttendance,
        rate: totalAttendance > 0 ? Math.round((presentToday / totalAttendance) * 100) : 0,
      },
      staff: {
        total: staff.length,
      },
      unreadMessages: unreadMessages.length,
      kits: {
        pendingAck: kitsPendingAck,
      },
      expenses: {
        monthTotal: Math.round(monthExpenseTotal),
      },
    });
  } catch (e) {
    console.error("[owner/dashboard]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
