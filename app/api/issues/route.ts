import { NextRequest, NextResponse } from "next/server";
import { listIssues } from "@/lib/servicenow/client";
import { handleRouteError } from "@/lib/api-helpers";
import { ConfidenceLevel, IssueFilters, ReviewStatus } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const filters: IssueFilters = {
      status: (params.get("status") as ReviewStatus) || undefined,
      confidence: (params.get("confidence") as ConfidenceLevel) || undefined,
      ciClass: params.get("ciClass") || undefined,
      supportGroup: params.get("supportGroup") || undefined,
      q: params.get("q") || undefined,
    };

    const items = await listIssues(filters);
    return NextResponse.json({ items });
  } catch (err) {
    return handleRouteError(err);
  }
}
