import type {
  EvidenceItem,
  GroupRef,
  GuardrailResult,
  GuardrailStatus,
  IssueCategory,
  RecommendationSource,
  SeverityBand,
} from "@/lib/types";

const RELATIONSHIP_TYPES = new Set([
  "self_reference",
  "duplicate_edge",
  "missing_link",
  "mismatched_classes",
]);

const SEVERITY_BY_TYPE: Record<string, number> = {
  self_reference: 100,
  missing_link: 85,
  missing_owner: 85,
  conflicting_owner: 70,
  mismatched_classes: 70,
  duplicate_edge: 60,
  stale_owner: 60,
};

export function severityBandFromScore(score: number): SeverityBand {
  if (score >= 90) return "Critical";
  if (score >= 75) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

export function inferIssueType(...signals: Array<string | null | undefined>): string {
  const text = signals.filter(Boolean).join(" ").toLowerCase();
  if (text.includes("self reference") || text.includes("self_reference")) return "self_reference";
  if (text.includes("duplicate")) return "duplicate_edge";
  if (text.includes("missing link") || text.includes("missing_link")) return "missing_link";
  if (text.includes("mismatched class") || text.includes("mismatched_classes")) return "mismatched_classes";
  if (text.includes("stale") || text.includes("inactive") || text.includes("transferred")) return "stale_owner";
  if (text.includes("conflict")) return "conflicting_owner";
  if (text.includes("missing owner") || text.includes("missing_owner") || text.includes("unowned")) return "missing_owner";
  return "ownership_review";
}

export function severityForIssueType(issueType: string): number {
  return SEVERITY_BY_TYPE[issueType] ?? 50;
}

export function categoryForIssueType(issueType: string): IssueCategory {
  return RELATIONSHIP_TYPES.has(issueType) ? "relationship" : "ownership";
}

export function formatIssueType(issueType: string): string {
  return issueType
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function deriveGuardrails(input: {
  confidence: number;
  rationale: string;
  evidence: EvidenceItem[];
  recommendedOwner: GroupRef | null;
  teamIdentifier: string | null;
}): GuardrailResult[] {
  const confidenceValid = Number.isFinite(input.confidence) && input.confidence >= 0 && input.confidence <= 100;
  const evidenceWeight = input.evidence.reduce((sum, item) => sum + Math.max(0, item.weight), 0);

  return [
    {
      key: "response_format",
      label: "Response structure",
      status: input.rationale.trim() && confidenceValid ? "pass" : "fail",
      detail: input.rationale.trim() && confidenceValid
        ? "Required recommendation fields are present and readable."
        : "The recommendation is missing required rationale or confidence data.",
    },
    {
      key: "target_exists",
      label: "Recommended target exists",
      status: input.recommendedOwner?.sys_id ? "pass" : input.recommendedOwner?.name ? "warn" : "fail",
      detail: input.recommendedOwner?.sys_id
        ? "The recommended group has a resolvable ServiceNow identifier."
        : input.recommendedOwner?.name
          ? "A group name was returned, but its ServiceNow identifier was not supplied."
          : "No valid recommended group was returned.",
    },
    {
      key: "confidence_bounds",
      label: "Confidence within bounds",
      status: confidenceValid ? "pass" : "fail",
      detail: confidenceValid
        ? `Confidence is ${input.confidence}%, within the allowed 0–100 range.`
        : "Confidence falls outside the allowed 0–100 range.",
    },
    {
      key: "evidence_consistency",
      label: "Evidence consistency",
      status: input.evidence.length >= 2 || evidenceWeight >= 50 ? "pass" : "warn",
      detail:
        input.evidence.length >= 2 || evidenceWeight >= 50
          ? "Deterministic evidence provides material support for the recommendation."
          : "The recommendation has limited deterministic evidence and needs closer review.",
    },
    {
      key: "team_scope",
      label: "Team scope verified",
      status: input.teamIdentifier ? "pass" : "warn",
      detail: input.teamIdentifier
        ? `The finding is scoped to team ${input.teamIdentifier}.`
        : "The API did not return a team identifier; verify scope before approval.",
    },
  ];
}

export function guardrailRollup(results: GuardrailResult[]): GuardrailStatus {
  if (results.some((result) => result.status === "fail")) return "fail";
  if (results.some((result) => result.status === "warn")) return "warn";
  return "pass";
}

export function normalizeRecommendationSource(value: string | null | undefined): RecommendationSource {
  return value === "deterministic_fallback" ? "deterministic_fallback" : "ai";
}
