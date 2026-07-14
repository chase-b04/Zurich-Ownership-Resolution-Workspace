import { NextResponse } from "next/server";
import { submitDecision } from "@/lib/servicenow/client";
import { errorResponse, handleRouteError } from "@/lib/api-helpers";
import { DecisionRequest } from "@/lib/types";

const VALID_DECISIONS = ["accepted", "overridden", "deferred"];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
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
