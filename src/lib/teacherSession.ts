import { SignJWT, jwtVerify } from "jose";

export interface TeacherSession {
  id:           string;
  username:     string;
  name:         string;
  sectionId:    string;
  sectionName:  string;
  programId:    string;
  programLabel: string;
  role:         string;
}

export const TEACHER_COOKIE_NAME = "ep_teacher_sid";
export const TEACHER_MAX_AGE     = 12 * 60 * 60; // 12 hours

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET missing or too short");
  return new TextEncoder().encode(secret);
}

export async function signTeacherSession(payload: TeacherSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TEACHER_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifyTeacherSession(token: string): Promise<TeacherSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      id:           payload.id           as string,
      username:     payload.username     as string,
      name:         payload.name         as string,
      sectionId:    payload.sectionId    as string,
      sectionName:  payload.sectionName  as string,
      programId:    payload.programId    as string,
      programLabel: payload.programLabel as string,
      role:         payload.role         as string,
    };
  } catch {
    return null;
  }
}
