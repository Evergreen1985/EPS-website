import type { SchoolConfig } from "./schoolConfig";
import { headers } from "next/headers";

const cache = new Map<string, { config: SchoolConfig; ts: number }>();
const TTL_MS = 60_000;

export function getSchoolSlug(): string {
  return process.env.NEXT_PUBLIC_SCHOOL_SLUG || "evergreen";
}

export async function getSchoolConfig(slug?: string): Promise<SchoolConfig> {
  // If no explicit slug, try the x-school-slug header injected by middleware
  let s = slug;
  if (!s) {
    try {
      const h = headers();
      s = h.get("x-school-slug") || getSchoolSlug();
    } catch {
      s = getSchoolSlug();
    }
  }

  const cached = cache.get(s);
  if (cached && Date.now() - cached.ts < TTL_MS) return cached.config;

  let config: SchoolConfig;
  try {
    const mod = await import(`@/content/schools/${s}.json`);
    config = mod.default as SchoolConfig;
  } catch {
    const mod = await import("@/content/schools/evergreen.json");
    config = mod.default as SchoolConfig;
  }

  cache.set(s, { config, ts: Date.now() });
  return config;
}
