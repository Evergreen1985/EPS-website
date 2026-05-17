import { SignJWT, jwtVerify } from "jose";

export interface AdminSession {
  username:    string;
  name:        string;
  role:        string;
  permissions?: string[]; // set for restricted staff; absent = full admin access
}

export const COOKIE_NAME     = "ep_admin_sid";
export const MAX_AGE_SECONDS = 8 * 60 * 60; // 8 hours

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET env var is missing or too short (need ≥ 32 chars)."
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * Create a signed JWT from a payload object.
 * Works in both Node.js (API routes) and Edge (middleware).
 */
export async function signSession(payload: AdminSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

/**
 * Verify a JWT and return the payload, or null if invalid / expired.
 */
export async function verifySession(token: string): Promise<AdminSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      username:    payload.username    as string,
      name:        payload.name        as string,
      role:        payload.role        as string,
      permissions: Array.isArray(payload.permissions) ? (payload.permissions as string[]) : undefined,
    };
  } catch {
    return null;
  }
}
