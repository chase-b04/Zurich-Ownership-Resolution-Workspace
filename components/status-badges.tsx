import { Badge } from "@/components/ui/badge";
import {
  ConfidenceLevel,
  GuardrailStatus,
  ReviewStatus,
  SeverityBand,
  confidenceLevel,
} from "@/lib/types";

const STATUS_TONE: Record<ReviewStatus, { tone: "blue" | "amber" | "green" | "neutral"; label: string }> = {
  open: { tone: "blue", label: "Open" },
  in_review: { tone: "amber", label: "In Review" },
  resolved: { tone: "green", label: "Resolved" },
  deferred: { tone: "neutral", label: "Deferred" },
};

const CONFIDENCE_TONE: Record<ConfidenceLevel, { tone: "green" | "amber" | "rose"; label: string }> = {
  high: { tone: "green", label: "High" },
  medium: { tone: "amber", label: "Medium" },
  low: { tone: "rose", label: "Low" },
};

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const { tone, label } = STATUS_TONE[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function ConfidenceBadge({ score }: { score: number }) {
  const level = confidenceLevel(score);
  const { tone, label } = CONFIDENCE_TONE[level];
  return <Badge tone={tone}>{label} · {score}%</Badge>;
}

const SEVERITY_TONE: Record<SeverityBand, "rose" | "amber" | "blue" | "neutral"> = {
  Critical: "rose",
  High: "amber",
  Medium: "blue",
  Low: "neutral",
};

export function SeverityBadge({ band, score }: { band: SeverityBand; score: number }) {
  return <Badge tone={SEVERITY_TONE[band]}>{band} · {score}</Badge>;
}

const GUARDRAIL_META: Record<GuardrailStatus, { tone: "green" | "amber" | "rose"; label: string }> = {
  pass: { tone: "green", label: "Checks passed" },
  warn: { tone: "amber", label: "Review checks" },
  fail: { tone: "rose", label: "Check failed" },
};

export function GuardrailBadge({ status }: { status: GuardrailStatus }) {
  const meta = GUARDRAIL_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
