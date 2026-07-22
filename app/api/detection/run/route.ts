import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { runDetection } from "@/lib/servicenow/client";
import { errorResponse, handleRouteError } from "@/lib/api-helpers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    const role = token ? verifySessionToken(token) : null;
    if (role !== "steward") {
      return errorResponse(403, "Steward role required to run detection");
    }

    return NextResponse.json(await runDetection());
  } catch (err) {
    return handleRouteError(err);
  }
}
