import twilio from "twilio";

function getClient() {
  return twilio(
    process.env.TWILIO_API_KEY!,
    process.env.TWILIO_API_SECRET!,
    { accountSid: process.env.TWILIO_ACCOUNT_SID! }
  );
}

function toWhatsAppNumber(phone: string): string {
  const clean = String(phone).replace(/\D/g, "");
  const withCountry = clean.startsWith("91") && clean.length === 12 ? clean : `91${clean.slice(-10)}`;
  return `whatsapp:+${withCountry}`;
}

// Returns true on success, false on failure (caller decides fallback)
export async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  try {
    await getClient().messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM!,
      to:   toWhatsAppNumber(phone),
      body: message,
    });
    return true;
  } catch (err) {
    console.error("[Twilio] WhatsApp send failed:", err);
    return false;
  }
}
