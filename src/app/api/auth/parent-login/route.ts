import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

// Dummy hash for timing-safe comparison when account not found
const DUMMY_HASH = "$2b$10$dummyhashfortimingattackpreventionxxxxxxxxxxxxxxxx";

export async function POST(req: Request) {
  try {
    // Rate limit: 10 attempts per IP per 15 minutes
    const ip = getClientIp(req);
    if (!rateLimit(`parent-login:${ip}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const { phone, dob, last4, password, action, childName, childDob, enquiryId } = body;

    if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 400 });

    // Validate phone format — digits only, 10 digits
    const phoneClean = String(phone).replace(/\D/g, "");
    if (phoneClean.length < 10) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    const client = sb();

    // ── CREATE account after enquiry ──────────────────
    if (action === "create") {
      const { data: existing } = await client
        .from("parent_accounts").select("id").eq("phone", phoneClean).maybeSingle();

      if (existing) return NextResponse.json({ success: true, message: "Account already exists" });

      const { error: ie } = await client.from("parent_accounts").insert({
        phone:          phoneClean,
        child_name:     childName || null,
        child_dob:      childDob  || null,
        enquiry_id:     enquiryId || null,
        is_first_login: true,
      });
      if (ie) return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
      return NextResponse.json({ success: true, created: true });
    }

    // ── FIRST TIME LOGIN ──────────────────────────────
    if (action === "first-login") {
      if (!dob || !last4) {
        return NextResponse.json({ error: "DOB and last 4 digits required" }, { status: 400 });
      }

      // Validate last4 is exactly 4 digits
      if (!/^\d{4}$/.test(String(last4).trim())) {
        return NextResponse.json({ error: "Last 4 digits must be 4 numbers" }, { status: 400 });
      }

      const { data: account } = await client
        .from("parent_accounts").select("*").eq("phone", phoneClean).maybeSingle();

      if (!account) return NextResponse.json({ error: "No account found. Please enquire first." }, { status: 404 });
      if (!account.is_first_login) {
        return NextResponse.json({ error: "Account already set up. Use your password.", alreadySetup: true }, { status: 400 });
      }

      // Verify DOB (compare dates as strings to avoid timezone issues)
      if (account.child_dob !== dob) {
        return NextResponse.json({ error: "Date of birth does not match." }, { status: 401 });
      }

      // Verify last 4 digits
      if (phoneClean.slice(-4) !== String(last4).trim()) {
        return NextResponse.json({ error: "Last 4 digits do not match." }, { status: 401 });
      }

      // Generate and HASH the initial password before storing
      const initial  = (account.child_name || "E").charAt(0).toUpperCase();
      const year     = String(dob).split("-")[0];
      const autoPass = `${initial}${year}${last4}`;
      const hash     = await bcrypt.hash(autoPass, 10);

      await client.from("parent_accounts").update({
        password_hash:  hash,
        is_first_login: false,
        last_login:     new Date().toISOString(),
      }).eq("phone", phoneClean);

      // Password is delivered only via the WhatsApp message — not in the JSON body
      const waMsg = `🌿 *Evergreen Preschool — Parent Portal*\n\nDear Parent,\n\nYour login has been created!\n\n🔐 *Login Credentials:*\n📱 Username: ${phoneClean}\n🔑 Password: ${autoPass}\n\n🌐 Login: https://evergreenprepschools.com/parent-login\n\n⚠️ Please save this password and change it after first login.\n\n_Evergreen Preschool & Daycare · 7411574504_`;
      const waUrl = `https://wa.me/91${phoneClean}?text=${encodeURIComponent(waMsg)}`;

      return NextResponse.json({
        success:    true,
        firstLogin: true,
        childName:  account.child_name,
        waMsg,
        waUrl,
        // Note: password intentionally NOT returned in response — delivered via WhatsApp only
      });
    }

    // ── REGULAR LOGIN ─────────────────────────────────
    if (action === "login") {
      if (!password) return NextResponse.json({ error: "Password required" }, { status: 400 });

      const passwordStr = String(password).slice(0, 128);

      const { data: account } = await client
        .from("parent_accounts").select("*").eq("phone", phoneClean).maybeSingle();

      // Always run bcrypt even when account not found (prevents timing-based enumeration)
      const hashToCheck = account?.password_hash ?? DUMMY_HASH;
      let passwordValid = await bcrypt.compare(passwordStr, hashToCheck).catch(() => false);

      // Backward compat: check plaintext for accounts not yet migrated, then rehash
      if (!passwordValid && account && account.password_hash === passwordStr) {
        passwordValid = true;
        const newHash = await bcrypt.hash(passwordStr, 10);
        await client.from("parent_accounts").update({ password_hash: newHash }).eq("phone", phoneClean);
      }

      if (!account || !passwordValid) {
        return NextResponse.json({ error: "Incorrect phone number or password." }, { status: 401 });
      }

      if (account.is_first_login) {
        return NextResponse.json({ error: "Please complete first-time setup.", needsSetup: true }, { status: 400 });
      }

      // Update last login (fire-and-forget)
      client.from("parent_accounts").update({ last_login: new Date().toISOString() }).eq("phone", phoneClean).then(() => {});

      return NextResponse.json({
        success:   true,
        phone:     phoneClean,
        childName: account.child_name,
        studentId: account.student_id,
        enquiryId: account.enquiry_id,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
