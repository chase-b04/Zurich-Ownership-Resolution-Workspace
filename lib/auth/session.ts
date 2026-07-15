import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { Role, SESSION_COOKIE } from "./types";

export type { Role };
export { SESSION_COOKIE };

// Demo-tier auth per planning.md: a shared access key per role, exchanged
// for a signed, httpOnly session cookie. Swapping to Microsoft Entra ID
// later only means replacing createSessionToken/verifySessionToken + the
// login route -- callers everywhere else just check a Role.

const MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not configured");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function createSessionToken(role: Role): string {
  const payload = `${role}:${Date.now()}`;
  const encoded = Buffer.from(payload).toString("base64url");
  return `${encoded}.${sign(payload)}`;
}

export function verifySessionToken(token: string): Role | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }

  if (!safeEqual(signature, sign(payload))) return null;

  const [role, iatStr] = payload.split(":");
  const iat = Number(iatStr);
  if (!iat || Date.now() - iat > MAX_AGE_MS) return null;
  if (role !== "steward" && role !== "viewer") return null;

  return role;
}

export function resolveRoleForApiKey(apiKey: string): Role | null {
  const stewardKey = process.env.STEWARD_API_KEY;
  const viewerKey = process.env.VIEWER_API_KEY;

  if (stewardKey && safeEqual(apiKey, stewardKey)) return "steward";
  if (viewerKey && safeEqual(apiKey, viewerKey)) return "viewer";
  return null;
}
