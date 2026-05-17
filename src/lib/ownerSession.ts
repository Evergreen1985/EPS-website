import { SignJWT, jwtVerify } from "jose";

export interface OwnerSession {
  username: string;
  name: string;
  role: string;
}

export const OWNER_COOKIE_NAME = "ep_owner_sid";
export const OWNER_MAX_AGE    = 8 * 60 * 60; // 8 hours

function getSecret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET env var missing or too short");
  return new TextEncoder().encode(s);
}

export async function signOwnerSession(payload: OwnerSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${OWNER_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifyOwnerSession(token: string): Promise<OwnerSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const role = payload.role as string;
    if (role !== "owner") return null;
    return { username: payload.username as string, name: payload.name as string, role };
  } catch {
    return null;
  }
}
