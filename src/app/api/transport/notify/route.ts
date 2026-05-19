import { NextRequest, NextResponse } from "next/server";
import { getSchoolConfig } from "@/lib/getSchoolConfig";

export const dynamic = "force-dynamic";

// POST /api/transport/notify — returns a WhatsApp deep-link for a transport notification
// The client opens window.open(waLink, "_blank") directly; no server SMS is sent.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { phone, child_name, status, checkin_time, checkout_time, notes } = body;

  if (!phone || !child_name || !status) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const clean = phone.replace(/\D/g, "").replace(/^0/, "");
  const number = clean.startsWith("91") ? clean : `91${clean}`;

  const school = await getSchoolConfig();
  let message = "";
  if (status === "boarded") {
    message = `Hi! ${child_name} has boarded the ${school.shortName} bus at ${checkin_time || "this time"}. Have a great day! 🚌`;
  } else if (status === "dropped") {
    message = `Hi! ${child_name} has been safely dropped at home at ${checkout_time || "this time"}. 🏠✅`;
  } else if (status === "absent") {
    message = `Hi! ${child_name} was marked absent from today's bus route. Please contact the school if this is incorrect.`;
  } else {
    message = `Hi! Update for ${child_name}: ${status}${notes ? ` — ${notes}` : ""}.`;
  }

  const waLink = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  return NextResponse.json({ waLink, message });
}
