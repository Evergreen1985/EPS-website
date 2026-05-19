import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSchoolConfig } from "@/lib/getSchoolConfig";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

export async function POST(req: Request) {
  const { feeId, phone, childName, amount, dueDate, periodLabel } = await req.json();
  const school = await getSchoolConfig();

  const formattedDate = new Date(dueDate).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" });
  const isOverdue     = new Date(dueDate) < new Date();

  const message = isOverdue
    ? `🔴 *Fee Overdue — ${school.name}*\n\nDear Parent,\n\nThe fee for *${childName}* is overdue.\n\n💰 Amount: ₹${amount}\n📅 Period: ${periodLabel || ""}\n⚠️ Due Date: ${formattedDate}\n\nKindly pay at the earliest to avoid any inconvenience.\n\nThank you 🙏\n*${school.name}*`
    : `📢 *Fee Reminder — ${school.name}*\n\nDear Parent,\n\nThis is a friendly reminder that the fee for *${childName}* is due soon.\n\n💰 Amount: ₹${amount}\n📅 Period: ${periodLabel || ""}\n📆 Due Date: ${formattedDate}\n\nPlease log in to your parent dashboard to pay online.\n\nThank you 🙏\n*${school.name}*`;

  const waLink = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;

  // Mark reminder as sent
  if (feeId) {
    await sb().from("fee_assignments").update({ reminder_sent_at: new Date().toISOString() }).eq("id", feeId);
  }

  return NextResponse.json({ success: true, waLink });
}
