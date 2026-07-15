import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { submitDecision } from "@/lib/servicenow/client";
import { errorResponse, handleRouteError } from "@/lib/api-helpers";
import { DecisionRequest } from "@/lib/types";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

const VALID_DECISIONS = ["accepted", "overridden", "deferred"];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    const role = token ? verifySessionToken(token) : null;
    if (role !== "steward") {
      return errorResponse(403, "Steward role required to submit a decision");
    }

    const { id } = await context.params;
    const body = (await request.json()) as Partial<DecisionRequest>;

    if (!body.decision || !VALID_DECISIONS.includes(body.decision)) {
      return errorResponse(400, "decision must be one of accepted, overridden, deferred");
    }
    if (body.decision === "overridden" && !body.final_group_id) {
      return errorResponse(400, "final_group_id is required when overriding a recommendation");
    }

    const result = await submitDecision(id, body as DecisionRequest);
    return NextResponse.json(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
