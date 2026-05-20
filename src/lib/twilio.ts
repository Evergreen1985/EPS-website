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

// Twilio Verify — sends OTP via SMS (works for any number, no opt-in or template needed)
export async function sendVerification(phone: string): Promise<boolean> {
  try {
    const clean = String(phone).replace(/\D/g, "");
    const e164  = clean.startsWith("91") && clean.length === 12 ? `+${clean}` : `+91${clean.slice(-10)}`;
    await getClient().verify.v2
      .services(process.env.TWILIO_VERIFY_SID!)
      .verifications.create({ to: e164, channel: "sms" });
    return true;
  } catch (err) {
    console.error("[Twilio] Verify send failed:", err);
    return false;
  }
}

// Returns "approved" | "pending" | "failed" | null
export async function checkVerification(phone: string, code: string): Promise<string | null> {
  try {
    const clean = String(phone).replace(/\D/g, "");
    const e164  = clean.startsWith("91") && clean.length === 12 ? `+${clean}` : `+91${clean.slice(-10)}`;
    const result = await getClient().verify.v2
      .services(process.env.TWILIO_VERIFY_SID!)
      .verificationChecks.create({ to: e164, code });
    return result.status;
  } catch (err) {
    console.error("[Twilio] Verify check failed:", err);
    return null;
  }
}
