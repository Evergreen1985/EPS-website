import { NextResponse } from "next/server";
import { getSchoolConfig } from "@/lib/getSchoolConfig";

export async function GET() {
  const school = await getSchoolConfig();

  // Return public config only — no secrets
  return NextResponse.json({
    // Infrastructure keys (existing)
    supabaseUrl:   process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    supabaseKey:   process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    googleMapsKey: process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",

    // School identity
    school: {
      slug:       school.slug,
      name:       school.name,
      shortName:  school.shortName,
      tagline:    school.tagline,
      domain:     school.domain,

      contact:  school.contact,
      address:  school.address,
      theme:    school.theme,
      branding: school.branding,
      social:   school.social,
      hours:    school.hours,
      rating:   school.rating,
      features: school.features,
      about:    school.about,
      faq:      school.faq,
    },
  });
}
