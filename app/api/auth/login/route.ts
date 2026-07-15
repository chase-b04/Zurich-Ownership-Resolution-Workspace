import { NextResponse } from "next/server";
import { createSessionToken, resolveRoleForApiKey, SESSION_COOKIE } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api-helpers";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const apiKey = body?.apiKey;

  if (!apiKey || typeof apiKey !== "string") {
    return errorResponse(400, "apiKey is required");
  }

  const role = resolveRoleForApiKey(apiKey);
  if (!role) {
    return errorResponse(401, "Invalid access key");
  }

  const token = createSessionToken(role);
  const res = NextResponse.json({ role });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
