import { NextResponse } from "next/server";
import { createSessionToken, resolveRoleForApiKey, SESSION_COOKIE } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api-helpers";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const apiKey = body?.apiKey;
  const viewerRequested = body?.viewer === true;

  let role: "steward" | "viewer";
  if (viewerRequested) {
    role = "viewer";
  } else {
    if (!apiKey || typeof apiKey !== "string") {
      return errorResponse(400, "Steward access key is required");
    }
    const resolvedRole = resolveRoleForApiKey(apiKey);
    if (resolvedRole !== "steward") {
      return errorResponse(401, "Invalid steward access key");
    }
    role = "steward";
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
