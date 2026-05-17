import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ── Fixed national holidays (same date every year) ───────────────────────────
const FIXED_NATIONAL: { month: number; day: number; name: string; icon: string }[] = [
  { month: 1,  day: 1,  name: "New Year's Day",             icon: "🎆" },
  { month: 1,  day: 26, name: "Republic Day",               icon: "🇮🇳" },
  { month: 4,  day: 14, name: "Dr. B.R. Ambedkar Jayanti",  icon: "📖" },
  { month: 5,  day: 1,  name: "May Day / Labour Day",       icon: "🔨" },
  { month: 8,  day: 15, name: "Independence Day",           icon: "🇮🇳" },
  { month: 10, day: 2,  name: "Gandhi Jayanti",             icon: "🪔" },
  { month: 12, day: 25, name: "Christmas Day",              icon: "🎄" },
];

// ── Variable national holidays (lunar/Christian calendar — year specific) ────
const VARIABLE_NATIONAL: Record<string, { date: string; name: string; icon: string }[]> = {
  "2024": [
    { date: "2024-01-14", name: "Pongal / Makar Sankranti",    icon: "🪁" },
    { date: "2024-01-15", name: "Thiruvalluvar Day",           icon: "📖" },
    { date: "2024-03-25", name: "Holi",                        icon: "🎨" },
    { date: "2024-03-29", name: "Good Friday",                 icon: "✝️" },
    { date: "2024-04-09", name: "Eid ul-Fitr",                 icon: "☪️" },
    { date: "2024-04-14", name: "Tamil New Year (Puthandu)",   icon: "🎊" },
    { date: "2024-04-17", name: "Mahavir Jayanti",             icon: "🙏" },
    { date: "2024-04-09", name: "Ugadi",                       icon: "🎊" },
    { date: "2024-05-23", name: "Buddha Purnima",              icon: "☸️" },
    { date: "2024-06-17", name: "Eid ul-Adha",                 icon: "☪️" },
    { date: "2024-07-17", name: "Muharram",                    icon: "☪️" },
    { date: "2024-08-15", name: "Onam",                        icon: "🌸" },
    { date: "2024-08-26", name: "Janmashtami",                 icon: "🦚" },
    { date: "2024-09-16", name: "Milad-un-Nabi",               icon: "☪️" },
    { date: "2024-10-02", name: "Dussehra / Vijayadashami",    icon: "🏹" },
    { date: "2024-11-01", name: "Diwali / Deepawali",          icon: "🪔" },
    { date: "2024-11-15", name: "Guru Nanak Jayanti",          icon: "🕌" },
  ],
  "2025": [
    { date: "2025-01-13", name: "Lohri",                       icon: "🔥" },
    { date: "2025-01-14", name: "Pongal / Makar Sankranti",    icon: "🪁" },
    { date: "2025-01-15", name: "Thiruvalluvar Day",           icon: "📖" },
    { date: "2025-03-14", name: "Holi",                        icon: "🎨" },
    { date: "2025-03-30", name: "Eid ul-Fitr",                 icon: "☪️" },
    { date: "2025-03-30", name: "Ugadi",                       icon: "🎊" },
    { date: "2025-04-10", name: "Mahavir Jayanti",             icon: "🙏" },
    { date: "2025-04-14", name: "Tamil New Year (Puthandu)",   icon: "🎊" },
    { date: "2025-04-18", name: "Good Friday",                 icon: "✝️" },
    { date: "2025-05-12", name: "Buddha Purnima",              icon: "☸️" },
    { date: "2025-06-07", name: "Eid ul-Adha",                 icon: "☪️" },
    { date: "2025-07-06", name: "Muharram",                    icon: "☪️" },
    { date: "2025-08-16", name: "Janmashtami",                 icon: "🦚" },
    { date: "2025-09-05", name: "Milad-un-Nabi",               icon: "☪️" },
    { date: "2025-10-02", name: "Dussehra / Vijayadashami",    icon: "🏹" },
    { date: "2025-10-20", name: "Diwali / Deepawali",          icon: "🪔" },
    { date: "2025-11-05", name: "Guru Nanak Jayanti",          icon: "🕌" },
  ],
  "2026": [
    { date: "2026-01-13", name: "Lohri",                       icon: "🔥" },
    { date: "2026-01-14", name: "Pongal / Makar Sankranti",    icon: "🪁" },
    { date: "2026-01-15", name: "Thiruvalluvar Day",           icon: "📖" },
    { date: "2026-03-03", name: "Holi",                        icon: "🎨" },
    { date: "2026-03-20", name: "Eid ul-Fitr",                 icon: "☪️" },
    { date: "2026-03-19", name: "Ugadi",                       icon: "🎊" },
    { date: "2026-04-03", name: "Good Friday",                 icon: "✝️" },
    { date: "2026-04-11", name: "Mahavir Jayanti",             icon: "🙏" },
    { date: "2026-04-14", name: "Tamil New Year (Puthandu)",   icon: "🎊" },
    { date: "2026-05-27", name: "Eid ul-Adha",                 icon: "☪️" },
    { date: "2026-05-31", name: "Buddha Purnima",              icon: "☸️" },
    { date: "2026-06-16", name: "Rath Yatra",                  icon: "🛕" },
    { date: "2026-06-26", name: "Muharram",                    icon: "☪️" },
    { date: "2026-08-05", name: "Janmashtami",                 icon: "🦚" },
    { date: "2026-08-25", name: "Milad-un-Nabi",               icon: "☪️" },
    { date: "2026-09-20", name: "Dussehra / Vijayadashami",    icon: "🏹" },
    { date: "2026-11-08", name: "Diwali / Deepawali",          icon: "🪔" },
    { date: "2026-10-23", name: "Guru Nanak Jayanti",          icon: "🕌" },
  ],
  "2027": [
    { date: "2027-01-13", name: "Lohri",                       icon: "🔥" },
    { date: "2027-01-14", name: "Pongal / Makar Sankranti",    icon: "🪁" },
    { date: "2027-01-15", name: "Thiruvalluvar Day",           icon: "📖" },
    { date: "2027-03-22", name: "Holi",                        icon: "🎨" },
    { date: "2027-03-09", name: "Eid ul-Fitr",                 icon: "☪️" },
    { date: "2027-03-26", name: "Good Friday",                 icon: "✝️" },
    { date: "2027-04-06", name: "Ugadi",                       icon: "🎊" },
    { date: "2027-04-14", name: "Tamil New Year (Puthandu)",   icon: "🎊" },
    { date: "2027-04-30", name: "Mahavir Jayanti",             icon: "🙏" },
    { date: "2027-05-16", name: "Eid ul-Adha",                 icon: "☪️" },
    { date: "2027-05-20", name: "Buddha Purnima",              icon: "☸️" },
    { date: "2027-06-14", name: "Muharram",                    icon: "☪️" },
    { date: "2027-08-25", name: "Janmashtami",                 icon: "🦚" },
    { date: "2027-08-15", name: "Milad-un-Nabi",               icon: "☪️" },
    { date: "2027-09-30", name: "Navratri Begins",             icon: "🪆" },
    { date: "2027-10-08", name: "Dussehra / Vijayadashami",    icon: "🏹" },
    { date: "2027-10-27", name: "Diwali / Deepawali",          icon: "🪔" },
    { date: "2027-11-01", name: "Guru Nanak Jayanti",          icon: "🕌" },
  ],
};

// ── State-specific additional holidays ───────────────────────────────────────
const STATE_HOLIDAYS: Record<string, { month: number; day: number; name: string; icon: string }[]> = {
  "Karnataka": [
    { month: 11, day: 1,  name: "Kannada Rajyotsava",         icon: "🏅" },
    { month: 4,  day: 24, name: "Dr. Rajkumar Jayanti",       icon: "🎂" },
    { month: 5,  day: 1,  name: "Karnataka Rajyotsava",       icon: "🏅" },
  ],
  "Tamil Nadu": [
    { month: 1,  day: 15, name: "Uzhavar Thirunal",           icon: "🌾" },
    { month: 11, day: 1,  name: "Tamil Nadu Day",             icon: "🏅" },
  ],
  "Maharashtra": [
    { month: 5,  day: 1,  name: "Maharashtra Day",            icon: "🏅" },
  ],
  "Andhra Pradesh": [
    { month: 11, day: 1,  name: "Andhra Pradesh Formation Day", icon: "🏅" },
  ],
  "Telangana": [
    { month: 6,  day: 2,  name: "Telangana Formation Day",    icon: "🏅" },
  ],
  "Kerala": [
    { month: 11, day: 1,  name: "Kerala Piravi",              icon: "🏅" },
    { month: 8,  day: 15, name: "Onam",                       icon: "🌸" },
  ],
  "Gujarat": [
    { month: 5,  day: 1,  name: "Gujarat Day",                icon: "🏅" },
  ],
  "Rajasthan": [
    { month: 3,  day: 30, name: "Rajasthan Day",              icon: "🏅" },
  ],
  "West Bengal": [
    { month: 1,  day: 23, name: "Netaji Subhash Chandra Bose Jayanti", icon: "🎂" },
    { month: 5,  day: 9,  name: "Rabindra Jayanti",           icon: "📖" },
  ],
  "Punjab": [
    { month: 1,  day: 13, name: "Lohri",                      icon: "🔥" },
  ],
  "Madhya Pradesh": [
    { month: 11, day: 1,  name: "MP Foundation Day",          icon: "🏅" },
  ],
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year  = searchParams.get("year")  || new Date().getFullYear().toString();
  const state = searchParams.get("state") || "";

  // Fixed national holidays
  const fixed = FIXED_NATIONAL.map(h => ({
    date:       `${year}-${String(h.month).padStart(2, "0")}-${String(h.day).padStart(2, "0")}`,
    name:       h.name,
    icon:       h.icon,
    event_type: "holiday",
    is_holiday: true,
    color:      "#E8694A",
    source:     "national",
  }));

  // Variable national holidays for the year
  const variable = (VARIABLE_NATIONAL[year] || []).map(h => ({
    ...h,
    event_type: "holiday",
    is_holiday: true,
    color:      "#E8694A",
    source:     "national",
  }));

  // State-specific fixed holidays
  const stateHols = (STATE_HOLIDAYS[state] || []).map(h => ({
    date:       `${year}-${String(h.month).padStart(2, "0")}-${String(h.day).padStart(2, "0")}`,
    name:       h.name,
    icon:       h.icon,
    event_type: "holiday",
    is_holiday: true,
    color:      "#E8694A",
    source:     "state",
  }));

  // Merge, deduplicate by date+name, sort
  const all = [...fixed, ...variable, ...stateHols];
  const seen = new Set<string>();
  const unique = all.filter(h => {
    const key = `${h.date}::${h.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  unique.sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    holidays: unique,
    state,
    year,
    counts: { fixed: fixed.length, variable: variable.length, state: stateHols.length },
  });
}
