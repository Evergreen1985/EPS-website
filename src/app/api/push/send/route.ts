import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { sendExpoPush } from "@/lib/expo-push";

// Configure VAPID lazily (only when keys exist) so importing this route at build
// time doesn't throw "No key set vapidDetails.publicKey" when keys aren't set.
let vapidReady = false;
function ensureVapid(): boolean {
  if (vapidReady) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
  const priv = process.env.VAPID_PRIVATE_KEY || "";
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_MAILTO || "mailto:admin@evergreenpreschool.in", pub, priv);
  vapidReady = true;
  return true;
}

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function POST(req: NextRequest) {
  try {
    const { title, body, url = "/parent-dashboard", screen, role, phones } = await req.json();
    if (!title || !body) return NextResponse.json({ error: "title and body required" }, { status: 400 });

    // ── Web Push (PWA) ────────────────────────────────────────────────────
    let webQuery = sb().from("push_subscriptions").select("*");
    if (role)          webQuery = webQuery.eq("role", role);
    if (phones?.length) webQuery = webQuery.in("phone", phones);

    const { data: subs } = await webQuery;
    const webPayload = JSON.stringify({ title, body, url, tag: "iva-" + Date.now() });

    let webSent = 0;
    const deadEndpoints: string[] = [];

    if (subs?.length && ensureVapid()) {
      await Promise.allSettled(
        subs.map(async (sub) => {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              webPayload
            );
            webSent++;
          } catch (e: any) {
            if (e.statusCode === 410 || e.statusCode === 404) deadEndpoints.push(sub.endpoint);
          }
        })
      );
      if (deadEndpoints.length) {
        await sb().from("push_subscriptions").delete().in("endpoint", deadEndpoints);
      }
    }

    // ── Expo Push (native mobile) ─────────────────────────────────────────
    const { sent: expoSent } = await sendExpoPush({
      title,
      body,
      data: screen ? { screen } : { screen: "/(main)/parent/home" },
      phones,
    });

    return NextResponse.json({ webSent, expoSent, deadWeb: deadEndpoints.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
