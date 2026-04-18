import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, dob, last4, password, action, childName, childDob, enquiryId } = body;

    if (!phone) return NextResponse.json({ error:"Phone required" }, { status:400 });

    const client = sb();

    // ── CREATE account after enquiry ──────────────────
    if (action === "create") {
      const { data: existing } = await client
        .from("parent_accounts").select("id").eq("phone", phone.trim()).maybeSingle();

      if (existing) return NextResponse.json({ success:true, message:"Account already exists" });

      const { error: ie } = await client.from("parent_accounts").insert({
        phone:          phone.trim(),
        child_name:     childName || null,
        child_dob:      childDob  || null,
        enquiry_id:     enquiryId || null,
        is_first_login: true,
      });
      if (ie) return NextResponse.json({ error:ie.message }, { status:500 });
      return NextResponse.json({ success:true, created:true });
    }

    // ── FIRST TIME LOGIN ──────────────────────────────
    if (action === "first-login") {
      if (!dob || !last4) return NextResponse.json({ error:"DOB and last 4 digits required" }, { status:400 });

      const { data: account } = await client
        .from("parent_accounts").select("*").eq("phone", phone.trim()).maybeSingle();

      if (!account) return NextResponse.json({ error:"No account found. Please enquire first." }, { status:404 });
      if (!account.is_first_login) return NextResponse.json({ error:"Account already set up. Use your password.", alreadySetup:true }, { status:400 });

      // Verify DOB
      if (account.child_dob !== dob) return NextResponse.json({ error:"Date of birth does not match." }, { status:401 });

      // Verify last 4 digits
      const phoneClean = phone.replace(/\D/g,"");
      if (phoneClean.slice(-4) !== last4.trim()) return NextResponse.json({ error:"Last 4 digits do not match." }, { status:401 });

      // Generate password: NameInitial + DOBYear + Last4
      const initial = (account.child_name || "E").charAt(0).toUpperCase();
      const year    = dob.split("-")[0];
      const autoPass = `${initial}${year}${last4}`;

      await client.from("parent_accounts").update({
        password_hash:  autoPass,
        is_first_login: false,
        last_login:     new Date().toISOString(),
      }).eq("phone", phone.trim());

      const waMsg = `🌿 *Evergreen Preschool — Parent Portal*\n\nDear Parent,\n\nYour login has been created!\n\n🔐 *Login Credentials:*\n📱 Username: ${phone}\n🔑 Password: ${autoPass}\n\n🌐 Login: https://evergreenprepschools.com/parent-login\n\n⚠️ Please save this password.\n\n_Evergreen Preschool & Daycare · 7411574504_`;

      return NextResponse.json({
        success:    true,
        firstLogin: true,
        password:   autoPass,
        childName:  account.child_name,
        waMsg,
        waUrl: `https://wa.me/91${phoneClean}?text=${encodeURIComponent(waMsg)}`,
      });
    }

    // ── REGULAR LOGIN ─────────────────────────────────
    if (action === "login") {
      if (!password) return NextResponse.json({ error:"Password required" }, { status:400 });

      const { data: account } = await client
        .from("parent_accounts").select("*").eq("phone", phone.trim()).maybeSingle();

      if (!account) return NextResponse.json({ error:"No account found." }, { status:404 });
      if (account.is_first_login) return NextResponse.json({ error:"Please complete first-time setup.", needsSetup:true }, { status:400 });
      if (account.password_hash !== password) return NextResponse.json({ error:"Incorrect password." }, { status:401 });

      await client.from("parent_accounts").update({ last_login: new Date().toISOString() }).eq("phone", phone.trim());

      return NextResponse.json({
        success:   true,
        phone,
        childName: account.child_name,
        studentId: account.student_id,
        enquiryId: account.enquiry_id,
      });
    }

    return NextResponse.json({ error:"Invalid action" }, { status:400 });

  } catch (e: any) {
    return NextResponse.json({ error:e?.message }, { status:500 });
  }
}
