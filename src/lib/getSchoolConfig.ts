import type { SchoolConfig } from "./schoolConfig";

const cache = new Map<string, { config: SchoolConfig; ts: number }>();
const TTL_MS = 60_000;

export function getSchoolSlug(): string {
  return process.env.NEXT_PUBLIC_SCHOOL_SLUG || "evergreen";
}

export async function getSchoolConfig(slug?: string): Promise<SchoolConfig> {
  const s = slug || getSchoolSlug();
  const cached = cache.get(s);
  if (cached && Date.now() - cached.ts < TTL_MS) return cached.config;

  let config: SchoolConfig;
  try {
    // Dynamic import so webpack bundles only what's needed
    const mod = await import(`@/content/schools/${s}.json`);
    config = mod.default as SchoolConfig;
  } catch {
    // Unknown slug → fall back to Evergreen
    const mod = await import("@/content/schools/evergreen.json");
    config = mod.default as SchoolConfig;
  }

  cache.set(s, { config, ts: Date.now() });
  return config;
}
