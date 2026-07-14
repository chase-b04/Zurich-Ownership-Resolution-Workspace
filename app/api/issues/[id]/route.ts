import { NextResponse } from "next/server";
import { getIssue } from "@/lib/servicenow/client";
import { errorResponse, handleRouteError } from "@/lib/api-helpers";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const issue = await getIssue(id);
    if (!issue) return errorResponse(404, "Issue not found");
    return NextResponse.json(issue);
  } catch (err) {
    return handleRouteError(err);
  }
}
