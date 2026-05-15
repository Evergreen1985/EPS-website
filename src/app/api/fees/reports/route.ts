import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // YYYY-MM

    const now       = new Date();
    const yearMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const [y, m]    = yearMonth.split("-").map(Number);
    const monthStart = `${yearMonth}-01`;
    const monthEnd   = `${yearMonth}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`;

    const client = sb();

    // Fetch all fee assignments
    const { data: allFees } = await client
      .from("fee_assignments")
      .select("*")
      .order("due_date", { ascending: false });

    const fees = allFees || [];

    // This month's fees (by due date)
    const monthFees = fees.filter(f =>
      f.due_date >= monthStart && f.due_date <= monthEnd
    );

    // Summary calculations
    const totalDue       = monthFees.reduce((s: number, f: any) => s + (f.amount || 0), 0);
    const totalCollected = fees
      .filter((f: any) => f.status === "paid" || f.status === "partial")
      .reduce((s: number, f: any) => s + (f.paid_amount || f.amount || 0), 0);
    const totalOutstanding = fees
      .filter((f: any) => f.status === "pending" || f.status === "partial")
      .reduce((s: number, f: any) => {
        const discount  = f.discount_amount || 0;
        const netAmount = f.amount - discount;
        const paid      = f.paid_amount || 0;
        return s + Math.max(0, netAmount - paid);
      }, 0);
    const totalOverdue = fees
      .filter((f: any) =>
        (f.status === "pending" || f.status === "partial") &&
        new Date(f.due_date) < new Date()
      )
      .reduce((s: number, f: any) => s + (f.amount - (f.paid_amount || 0) - (f.discount_amount || 0)), 0);

    // Cash vs online breakdown
    const cashCollected = fees
      .filter((f: any) => (f.status === "paid" || f.status === "partial") && f.payment_mode !== "online")
      .reduce((s: number, f: any) => s + (f.paid_amount || f.amount || 0), 0);
    const onlineCollected = fees
      .filter((f: any) => (f.status === "paid" || f.status === "partial") && f.payment_mode === "online")
      .reduce((s: number, f: any) => s + (f.paid_amount || f.amount || 0), 0);

    // Payment mode breakdown
    const modeBreakdown: Record<string, number> = {};
    fees
      .filter((f: any) => f.status === "paid" || f.status === "partial")
      .forEach((f: any) => {
        const mode = f.payment_mode || "online";
        modeBreakdown[mode] = (modeBreakdown[mode] || 0) + (f.paid_amount || f.amount || 0);
      });

    // Overdue list
    const overdueList = fees
      .filter((f: any) =>
        (f.status === "pending" || f.status === "partial") &&
        new Date(f.due_date) < new Date()
      )
      .map((f: any) => ({
        id:          f.id,
        child_name:  f.child_name,
        amount:      f.amount,
        paid_amount: f.paid_amount || 0,
        balance:     f.amount - (f.paid_amount || 0) - (f.discount_amount || 0),
        due_date:    f.due_date,
        period_label: f.period_label,
        enquiry_id:  f.enquiry_id,
      }))
      .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

    // Recent payments (last 10)
    const recentPayments = fees
      .filter((f: any) => f.status === "paid" || f.status === "partial")
      .sort((a: any, b: any) => new Date(b.paid_at || b.updated_at).getTime() - new Date(a.paid_at || a.updated_at).getTime())
      .slice(0, 10)
      .map((f: any) => ({
        id:              f.id,
        child_name:      f.child_name,
        amount:          f.paid_amount || f.amount,
        payment_mode:    f.payment_mode || "online",
        receipt_number:  f.receipt_number,
        paid_at:         f.paid_at,
        period_label:    f.period_label,
      }));

    return NextResponse.json({
      summary: {
        totalDue,
        totalCollected,
        totalOutstanding,
        totalOverdue,
        cashCollected,
        onlineCollected,
        modeBreakdown,
      },
      overdueList,
      recentPayments,
      month: yearMonth,
    });

  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
