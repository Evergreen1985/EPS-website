import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;  // e.g. { screen: "/(main)/parent/fees" }
  phones?: string[];               // target specific phones; omit = send to all parents
}

export async function sendExpoPush({ title, body, data = {}, phones }: PushPayload) {
  let query = sb().from("expo_push_tokens").select("token");
  if (phones?.length) query = query.in("phone", phones);

  const { data: rows } = await query;
  if (!rows?.length) return { sent: 0 };

  const messages = rows.map((r) => ({
    to:    r.token,
    sound: "default",
    title,
    body,
    data,
  }));

  // Expo Push API accepts up to 100 messages per request
  const chunks: typeof messages[] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  let sent = 0;
  const dead: string[] = [];

  await Promise.allSettled(
    chunks.map(async (chunk) => {
      const res  = await fetch("https://exp.host/--/api/v2/push/send", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body:    JSON.stringify(chunk),
      });
      const json = await res.json();
      const results: any[] = json?.data || [];
      results.forEach((r, i) => {
        if (r.status === "ok") {
          sent++;
        } else if (r.details?.error === "DeviceNotRegistered") {
          dead.push(chunk[i].to);
        }
      });
    })
  );

  if (dead.length) {
    await sb().from("expo_push_tokens").delete().in("token", dead);
  }

  return { sent, dead: dead.length };
}
