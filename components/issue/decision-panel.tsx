"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/input";
import { ReviewStatusBadge } from "@/components/status-badges";
import { Decision, GroupRef, OwnershipIssue } from "@/lib/types";
import type { Role } from "@/lib/auth/types";

export function DecisionPanel({
  issue,
  groups,
  role,
}: {
  issue: OwnershipIssue;
  groups: GroupRef[];
  role: Role | null;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(issue.decisionNotes ?? "");
  const [overrideGroupId, setOverrideGroupId] = useState(groups[0]?.sys_id ?? "");
  const [showOverride, setShowOverride] = useState(false);
  const [pending, setPending] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submittedDecision, setSubmittedDecision] = useState<Decision | null>(null);
  const [submittedNotes, setSubmittedNotes] = useState<string | null>(null);

  const alreadyDecided = issue.reviewStatus === "resolved" || issue.reviewStatus === "deferred";
  const isRelationship = issue.issueCategory === "relationship";
  const displayedDecision = submittedDecision ?? issue.decision;
  const displayedNotes = submittedNotes ?? issue.decisionNotes;

  async function submit(decision: Decision, finalGroupId?: string) {
    setPending(decision);
    setError(null);
    try {
      const res = await fetch(`/api/issues/${issue.sys_id}/decision`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          final_group_id: finalGroupId,
          relationship_action:
            isRelationship && decision === "accepted"
              ? issue.recommendedChange?.action
              : undefined,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Failed to submit decision");
      }
      setSubmittedDecision(decision);
      setSubmittedNotes(notes.trim() || null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit decision");
    } finally {
      setPending(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Decision Workspace</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {alreadyDecided ? (
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Status</span>
              <ReviewStatusBadge status={issue.reviewStatus} />
            </div>
            <p className="text-zinc-700 dark:text-zinc-300">
              Decision:{" "}
              <span className="font-medium">
                {displayedDecision
                  ? displayedDecision.charAt(0).toUpperCase() + displayedDecision.slice(1)
                  : "Completed in ServiceNow"}
              </span>
              {issue.finalOwner ? ` — final owner ${issue.finalOwner.name}` : ""}
            </p>
            {displayedNotes && (
              <p className="text-zinc-500 dark:text-zinc-400">Notes: {displayedNotes}</p>
            )}
          </div>
        ) : role !== "steward" ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Viewer access — steward role required to submit a decision.
          </p>
        ) : (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Decision Notes</label>
              <Textarea
                rows={3}
                className="w-full"
                placeholder="Capture rationale for this decision…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() =>
                  submit(
                    "accepted",
                    isRelationship ? undefined : issue.recommendedOwner?.sys_id
                  )
                }
                disabled={
                  pending !== null ||
                  (isRelationship && issue.recommendedChange?.action !== "delete_relationship")
                }
              >
                {pending === "accepted"
                  ? "Applying…"
                  : isRelationship
                    ? "Remove Self-Reference"
                    : "Accept Recommendation"}
              </Button>
              {!isRelationship && (
                <Button
                  variant="outline"
                  onClick={() => setShowOverride((v) => !v)}
                  disabled={pending !== null}
                >
                  Override Recommendation
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => submit("deferred")}
                disabled={pending !== null}
              >
                {pending === "deferred" ? "Deferring…" : "Defer Review"}
              </Button>
            </div>

            {isRelationship && (
              <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                This removes only the identified relationship record. Neither endpoint CI is
                deleted or modified, and ServiceNow must revalidate the relationship before
                applying the change.
              </p>
            )}

            {!isRelationship && showOverride && (
              <div className="flex flex-wrap items-center gap-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
                <Select
                  value={overrideGroupId}
                  onChange={(e) => setOverrideGroupId(e.target.value)}
                >
                  {groups.map((g) => (
                    <option key={g.sys_id} value={g.sys_id}>
                      {g.name}
                    </option>
                  ))}
                </Select>
                <Button
                  variant="secondary"
                  onClick={() => submit("overridden", overrideGroupId)}
                  disabled={pending !== null}
                >
                  {pending === "overridden" ? "Submitting…" : "Confirm Override"}
                </Button>
              </div>
            )}
          </>
        )}

        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      </CardContent>
    </Card>
  );
}
