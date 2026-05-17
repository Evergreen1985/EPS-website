import { SignJWT, jwtVerify } from "jose";

export interface ParentSession {
  phone:     string;
  childName: string;
  enquiryId: string;
}

export const PARENT_COOKIE_NAME = "ep_parent_sid";
export const PARENT_MAX_AGE     = 24 * 60 * 60; // 24 hours

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET missing or too short");
  return new TextEncoder().encode(secret);
}

export async function signParentSession(payload: ParentSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${PARENT_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifyParentSession(token: string): Promise<ParentSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      phone:     payload.phone     as string,
      childName: payload.childName as string,
      enquiryId: payload.enquiryId as string,
    };
  } catch {
    return null;
  }
}
