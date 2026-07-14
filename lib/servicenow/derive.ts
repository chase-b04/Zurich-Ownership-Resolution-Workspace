import {
  ActivityEntry,
  AnalyticsData,
  ConfidenceLevel,
  DashboardSummary,
  OwnershipIssue,
  confidenceLevel,
} from "@/lib/types";

// Pure aggregation helpers shared by the mock store and the live ServiceNow
// path. The Ownership API only exposes issue/group/decision routes, so
// dashboard and analytics figures are always derived here rather than
// fetched from a dedicated endpoint.

export function computeDashboardSummary(issues: OwnershipIssue[]): DashboardSummary {
  const summary: DashboardSummary = {
    total: issues.length,
    open: 0,
    resolved: 0,
    deferred: 0,
    highConfidence: 0,
    mediumConfidence: 0,
    lowConfidence: 0,
  };

  for (const issue of issues) {
    if (issue.reviewStatus === "open" || issue.reviewStatus === "in_review") summary.open += 1;
    if (issue.reviewStatus === "resolved") summary.resolved += 1;
    if (issue.reviewStatus === "deferred") summary.deferred += 1;

    const level = confidenceLevel(issue.aiConfidence);
    if (level === "high") summary.highConfidence += 1;
    if (level === "medium") summary.mediumConfidence += 1;
    if (level === "low") summary.lowConfidence += 1;
  }

  return summary;
}

export function computeAnalytics(issues: OwnershipIssue[]): AnalyticsData {
  const byClassMap = new Map<string, number>();
  const byConfidenceMap = new Map<ConfidenceLevel, number>([
    ["high", 0],
    ["medium", 0],
    ["low", 0],
  ]);
  const byTeamMap = new Map<string, number>();
  const trendMap = new Map<string, number>();

  for (const issue of issues) {
    byClassMap.set(issue.childCi.ciClass, (byClassMap.get(issue.childCi.ciClass) ?? 0) + 1);

    const level = confidenceLevel(issue.aiConfidence);
    byConfidenceMap.set(level, (byConfidenceMap.get(level) ?? 0) + 1);

    const team = issue.recommendedOwner?.name ?? "Unassigned";
    byTeamMap.set(team, (byTeamMap.get(team) ?? 0) + 1);

    if (issue.reviewStatus === "resolved") {
      const date = issue.updated.slice(0, 10);
      trendMap.set(date, (trendMap.get(date) ?? 0) + 1);
    }
  }

  return {
    byClass: Array.from(byClassMap.entries()).map(([ciClass, count]) => ({ ciClass, count })),
    byConfidence: Array.from(byConfidenceMap.entries()).map(([level, count]) => ({ level, count })),
    byTeam: Array.from(byTeamMap.entries()).map(([team, count]) => ({ team, count })),
    resolutionTrend: Array.from(trendMap.entries())
      .map(([date, resolved]) => ({ date, resolved }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}

// Best-effort activity feed for the live ServiceNow path, which does not
// expose a dedicated audit-history endpoint. Recommend adding one
// (mirroring the mock store's activityLog) if a literal audit trail is
// needed beyond what's inferable from issue state.
export function deriveActivityFromIssues(issues: OwnershipIssue[]): ActivityEntry[] {
  const entries: ActivityEntry[] = [];

  for (const issue of issues) {
    entries.push({
      id: `derived-rec-${issue.sys_id}`,
      type: "recommendation_generated",
      issueNumber: issue.number,
      issueSysId: issue.sys_id,
      ciName: issue.childCi.name,
      message: `AI recommended ${issue.recommendedOwner?.name ?? "no owner"} with ${issue.aiConfidence}% confidence`,
      actor: "CMDBRelationshipAnalyzer",
      timestamp: issue.created,
    });

    if (issue.decision) {
      entries.push({
        id: `derived-decision-${issue.sys_id}`,
        type: "decision_submitted",
        issueNumber: issue.number,
        issueSysId: issue.sys_id,
        ciName: issue.childCi.name,
        message: `Decision "${issue.decision}" submitted${issue.finalOwner ? ` — final owner ${issue.finalOwner.name}` : ""}`,
        actor: "steward.review",
        timestamp: issue.updated,
      });
    }
  }

  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
