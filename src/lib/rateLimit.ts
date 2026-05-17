// Simple in-memory rate limiter (resets on cold start — acceptable for this scale)
const store = new Map<string, { count: number; resetAt: number }>();

/**
 * Returns true if the request is allowed, false if rate-limited.
 * @param key    Unique key per IP + action (e.g. "login:1.2.3.4")
 * @param limit  Max requests allowed in the window
 * @param windowMs  Window duration in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}

/** Extract the client IP from the request headers. */
export function getClientIp(req: Request): string {
  const forwarded = (req.headers as any).get?.("x-forwarded-for") ??
                    (req as any).headers?.["x-forwarded-for"] ?? "";
  return (typeof forwarded === "string" ? forwarded.split(",")[0] : "").trim() || "unknown";
}
