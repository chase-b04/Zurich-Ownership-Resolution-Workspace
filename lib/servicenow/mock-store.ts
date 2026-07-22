import {
  ActivityEntry,
  DecisionRequest,
  DecisionResponse,
  DetectionRunResult,
  GroupRef,
  IssueFilters,
  IssueListItem,
  OwnershipIssue,
  confidenceLevel,
} from "@/lib/types";

// In-memory sample dataset standing in for the ServiceNow CMDB Ownership
// table while SERVICENOW_URL is not configured. Resets whenever the dev
// server restarts -- this is a demo aid, not a database.

const GROUPS: GroupRef[] = [
  { sys_id: "grp-payments-ops", name: "Payments-Ops" },
  { sys_id: "grp-platform-infra", name: "Platform-Infra" },
  { sys_id: "grp-app-support", name: "App-Support" },
  { sys_id: "grp-network-eng", name: "Network-Engineering" },
  { sys_id: "grp-data-eng", name: "Data-Engineering" },
  { sys_id: "grp-checkout-svc", name: "Checkout-Services" },
];

// These records intentionally contain no issue label. The mock detector derives
// missing ownership from their ordinary CMDB-like fields, mirroring the live
// ServiceNow detector without pretending these are pre-classified findings.
const RAW_MOCK_CIS = [
  {
    sys_id: "ci-customer-profile-worker",
    name: "customer-profile-worker",
    ciClass: "Application",
    supportGroup: null,
    managedBy: "j.alvarez",
    relatedOwnerSignals: ["Checkout-Services", "Checkout-Services", "App-Support"],
  },
];

function group(name: string): GroupRef {
  const found = GROUPS.find((g) => g.name === name);
  if (!found) throw new Error(`Unknown seed group ${name}`);
  return found;
}

function daysAgo(n: number): string {
  const d = new Date("2026-07-14T09:00:00Z");
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString();
}

interface SeedIssue {
  sys_id: string;
  number: string;
  ciName: string;
  ciClass: string;
  relationshipType: string;
  currentOwner: string | null;
  currentSupportGroup: GroupRef | null;
  managedBy: string | null;
  evidence: { type: string; value: string; weight: number }[];
  aiReason: string;
  aiRationale: string;
  aiConfidence: number;
  recommendedOwner: GroupRef | null;
  reviewStatus: OwnershipIssue["reviewStatus"];
  decision: OwnershipIssue["decision"];
  decisionNotes: string | null;
  finalOwner: GroupRef | null;
  notes: string | null;
  identifiedDaysAgo: number;
  updatedDaysAgo: number;
}

const SEED: SeedIssue[] = [
  {
    sys_id: "iss-orders-db",
    number: "OWN0010001",
    ciName: "orders-db",
    ciClass: "Database",
    relationshipType: "Depends on::checkout-api",
    currentOwner: null,
    currentSupportGroup: null,
    managedBy: null,
    evidence: [
      { type: "similar_ci_owner", value: "4 of 5 similar checkout databases are owned by Payments-Ops", weight: 55 },
      { type: "relationship", value: "orders-db is a dependency of checkout-api, owned by Payments-Ops", weight: 30 },
    ],
    aiReason: "Missing owner, strong peer-CI signal",
    aiRationale:
      "Payments-Ops is recommended because the majority of similar database CIs are owned by Payments-Ops and orders-db is a direct dependency of checkout-api, which Payments-Ops already supports.",
    aiConfidence: 92,
    recommendedOwner: group("Payments-Ops"),
    reviewStatus: "open",
    decision: null,
    decisionNotes: null,
    finalOwner: null,
    notes: null,
    identifiedDaysAgo: 6,
    updatedDaysAgo: 6,
  },
  {
    sys_id: "iss-checkout-api",
    number: "OWN0010002",
    ciName: "checkout-api",
    ciClass: "Application",
    relationshipType: "Used by::web-storefront",
    currentOwner: "Checkout-Services",
    currentSupportGroup: group("Checkout-Services"),
    managedBy: "j.alvarez",
    evidence: [
      { type: "name_pattern", value: "CI name prefix 'checkout-' matches Payments-Ops naming convention", weight: 20 },
      { type: "incident_history", value: "3 of the last 4 incidents were triaged by Payments-Ops", weight: 35 },
    ],
    aiReason: "Current owner conflicts with incident routing history",
    aiRationale:
      "Recent incident history shows Payments-Ops handling the majority of checkout-api incidents, which conflicts with the currently assigned Checkout-Services group. A steward should confirm the correct accountable team.",
    aiConfidence: 71,
    recommendedOwner: group("Payments-Ops"),
    reviewStatus: "in_review",
    decision: null,
    decisionNotes: null,
    finalOwner: null,
    notes: "Flagged during Q3 governance sweep.",
    identifiedDaysAgo: 9,
    updatedDaysAgo: 2,
  },
  {
    sys_id: "iss-web-01",
    number: "OWN0010003",
    ciName: "web-01",
    ciClass: "Server",
    relationshipType: "Hosts::checkout-api",
    currentOwner: "Platform-Infra",
    currentSupportGroup: group("Platform-Infra"),
    managedBy: "r.chen (inactive)",
    evidence: [
      { type: "service_owner", value: "managed_by user r.chen is no longer an active employee", weight: 40 },
      { type: "similar_ci_owner", value: "Sibling host web-02 is owned by Platform-Infra", weight: 25 },
    ],
    aiReason: "Stale owner, inactive managed_by user",
    aiRationale:
      "Platform-Infra remains the correct accountable team based on sibling host ownership; only the managed_by contact needs to be refreshed.",
    aiConfidence: 88,
    recommendedOwner: group("Platform-Infra"),
    reviewStatus: "resolved",
    decision: "accepted",
    decisionNotes: "Confirmed with Platform-Infra lead, updated managed_by separately.",
    finalOwner: group("Platform-Infra"),
    notes: null,
    identifiedDaysAgo: 18,
    updatedDaysAgo: 14,
  },
  {
    sys_id: "iss-web-02",
    number: "OWN0010004",
    ciName: "web-02",
    ciClass: "Server",
    relationshipType: "Hosts::checkout-api",
    currentOwner: "Platform-Infra",
    currentSupportGroup: group("Platform-Infra"),
    managedBy: null,
    evidence: [{ type: "relationship", value: "Only 1 supporting signal found for current assignment", weight: 15 }],
    aiReason: "Owner present but weakly supported",
    aiRationale:
      "Current ownership is plausible but only one weak signal supports it. Additional review is recommended before treating this as confirmed.",
    aiConfidence: 48,
    recommendedOwner: group("Platform-Infra"),
    reviewStatus: "open",
    decision: null,
    decisionNotes: null,
    finalOwner: null,
    notes: null,
    identifiedDaysAgo: 5,
    updatedDaysAgo: 5,
  },
  {
    sys_id: "iss-payments-gateway-db",
    number: "OWN0010005",
    ciName: "payments-gateway-db",
    ciClass: "Database",
    relationshipType: "Depends on::checkout-api",
    currentOwner: null,
    currentSupportGroup: null,
    managedBy: null,
    evidence: [
      { type: "similar_ci_owner", value: "All 3 payments-* databases are owned by Payments-Ops", weight: 60 },
    ],
    aiReason: "Missing owner, unanimous peer-CI signal",
    aiRationale: "Every other payments-* database CI is owned by Payments-Ops, making it the clear accountable team.",
    aiConfidence: 96,
    recommendedOwner: group("Payments-Ops"),
    reviewStatus: "resolved",
    decision: "accepted",
    decisionNotes: "Straightforward, accepted as-is.",
    finalOwner: group("Payments-Ops"),
    notes: null,
    identifiedDaysAgo: 22,
    updatedDaysAgo: 20,
  },
  {
    sys_id: "iss-inventory-svc",
    number: "OWN0010006",
    ciName: "inventory-svc",
    ciClass: "Application",
    relationshipType: "Used by::checkout-api",
    currentOwner: null,
    currentSupportGroup: null,
    managedBy: "s.patel",
    evidence: [
      { type: "service_owner", value: "Manager s.patel belongs to Data-Engineering", weight: 30 },
      { type: "name_pattern", value: "No strong naming convention match", weight: 5 },
    ],
    aiReason: "Missing owner, moderate signal",
    aiRationale: "The assigned manager belongs to Data-Engineering, but supporting evidence is limited.",
    aiConfidence: 66,
    recommendedOwner: group("Data-Engineering"),
    reviewStatus: "deferred",
    decision: "deferred",
    decisionNotes: "Waiting on service catalog cleanup before deciding.",
    finalOwner: null,
    notes: null,
    identifiedDaysAgo: 12,
    updatedDaysAgo: 10,
  },
  {
    sys_id: "iss-auth-service",
    number: "OWN0010007",
    ciName: "auth-service",
    ciClass: "Application",
    relationshipType: "Used by::checkout-api",
    currentOwner: "Data-Engineering",
    currentSupportGroup: group("Data-Engineering"),
    managedBy: null,
    evidence: [
      { type: "relationship", value: "auth-service is a shared dependency of 6 application CIs owned by App-Support", weight: 45 },
      { type: "incident_history", value: "All recent incidents routed to App-Support", weight: 35 },
    ],
    aiReason: "Current owner conflicts with relationship graph",
    aiRationale:
      "App-Support owns the majority of CIs that depend on auth-service, and recent incidents were consistently routed there instead of Data-Engineering.",
    aiConfidence: 84,
    recommendedOwner: group("App-Support"),
    reviewStatus: "open",
    decision: null,
    decisionNotes: null,
    finalOwner: null,
    notes: null,
    identifiedDaysAgo: 4,
    updatedDaysAgo: 4,
  },
  {
    sys_id: "iss-lb-prod-01",
    number: "OWN0010008",
    ciName: "lb-prod-01",
    ciClass: "Network",
    relationshipType: "Routes to::web-01",
    currentOwner: null,
    currentSupportGroup: null,
    managedBy: null,
    evidence: [{ type: "name_pattern", value: "Naming convention suggests production network tier", weight: 10 }],
    aiReason: "Missing owner, low confidence",
    aiRationale: "Limited evidence is available; naming convention weakly suggests Network-Engineering.",
    aiConfidence: 38,
    recommendedOwner: group("Network-Engineering"),
    reviewStatus: "open",
    decision: null,
    decisionNotes: null,
    finalOwner: null,
    notes: null,
    identifiedDaysAgo: 3,
    updatedDaysAgo: 3,
  },
  {
    sys_id: "iss-reporting-db",
    number: "OWN0010009",
    ciName: "reporting-db",
    ciClass: "Database",
    relationshipType: "Depends on::inventory-svc",
    currentOwner: "Data-Engineering",
    currentSupportGroup: group("Data-Engineering"),
    managedBy: "s.patel (transferred)",
    evidence: [{ type: "service_owner", value: "managed_by user transferred teams 90 days ago", weight: 25 }],
    aiReason: "Stale owner, managed_by transferred",
    aiRationale: "Data-Engineering is still the most likely accountable team but the managed_by contact needs updating.",
    aiConfidence: 74,
    recommendedOwner: group("Data-Engineering"),
    reviewStatus: "in_review",
    decision: null,
    decisionNotes: null,
    finalOwner: null,
    notes: null,
    identifiedDaysAgo: 8,
    updatedDaysAgo: 1,
  },
  {
    sys_id: "iss-cache-node-03",
    number: "OWN0010010",
    ciName: "cache-node-03",
    ciClass: "Server",
    relationshipType: "Hosts::checkout-api",
    currentOwner: null,
    currentSupportGroup: null,
    managedBy: null,
    evidence: [
      { type: "similar_ci_owner", value: "cache-node-01 and cache-node-02 are both owned by Platform-Infra", weight: 50 },
    ],
    aiReason: "Missing owner, strong peer-CI signal",
    aiRationale: "Both sibling cache nodes are owned by Platform-Infra, making it the clear recommendation.",
    aiConfidence: 90,
    recommendedOwner: group("Platform-Infra"),
    reviewStatus: "resolved",
    decision: "accepted",
    decisionNotes: "Matches sibling nodes.",
    finalOwner: group("Platform-Infra"),
    notes: null,
    identifiedDaysAgo: 25,
    updatedDaysAgo: 24,
  },
  {
    sys_id: "iss-fraud-detection-svc",
    number: "OWN0010011",
    ciName: "fraud-detection-svc",
    ciClass: "Application",
    relationshipType: "Used by::checkout-api",
    currentOwner: null,
    currentSupportGroup: null,
    managedBy: null,
    evidence: [{ type: "relationship", value: "Consumes data from payments-gateway-db (Payments-Ops)", weight: 30 }],
    aiReason: "Missing owner, single relationship signal",
    aiRationale: "The only strong signal is a data dependency on a Payments-Ops-owned database.",
    aiConfidence: 61,
    recommendedOwner: group("Payments-Ops"),
    reviewStatus: "open",
    decision: null,
    decisionNotes: null,
    finalOwner: null,
    notes: null,
    identifiedDaysAgo: 2,
    updatedDaysAgo: 2,
  },
  {
    sys_id: "iss-vpn-gateway",
    number: "OWN0010012",
    ciName: "vpn-gateway",
    ciClass: "Network",
    relationshipType: "Routes to::auth-service",
    currentOwner: null,
    currentSupportGroup: null,
    managedBy: null,
    evidence: [],
    aiReason: "Missing owner, no supporting signals",
    aiRationale: "No relationship, naming, or historical signals were found. Manual investigation is required.",
    aiConfidence: 22,
    recommendedOwner: group("Network-Engineering"),
    reviewStatus: "deferred",
    decision: "deferred",
    decisionNotes: "Needs manual investigation, no AI signal available.",
    finalOwner: null,
    notes: null,
    identifiedDaysAgo: 15,
    updatedDaysAgo: 13,
  },
  {
    sys_id: "iss-billing-db",
    number: "OWN0010013",
    ciName: "billing-db",
    ciClass: "Database",
    relationshipType: "Depends on::checkout-api",
    currentOwner: "Checkout-Services",
    currentSupportGroup: group("Checkout-Services"),
    managedBy: null,
    evidence: [
      { type: "similar_ci_owner", value: "All other billing-* databases are owned by Payments-Ops", weight: 55 },
      { type: "name_pattern", value: "Naming convention matches Payments-Ops databases", weight: 15 },
    ],
    aiReason: "Current owner conflicts with peer-CI convention",
    aiRationale: "Payments-Ops owns every other billing-* database, which conflicts with the current Checkout-Services assignment.",
    aiConfidence: 87,
    recommendedOwner: group("Payments-Ops"),
    reviewStatus: "resolved",
    decision: "overridden",
    decisionNotes: "Confirmed with service owner; moved to Payments-Ops.",
    finalOwner: group("Payments-Ops"),
    notes: null,
    identifiedDaysAgo: 30,
    updatedDaysAgo: 27,
  },
  {
    sys_id: "iss-notification-svc",
    number: "OWN0010014",
    ciName: "notification-svc",
    ciClass: "Application",
    relationshipType: "Used by::checkout-api",
    currentOwner: null,
    currentSupportGroup: null,
    managedBy: null,
    evidence: [{ type: "service_owner", value: "Parent Checkout service is owned by Checkout-Services", weight: 40 }],
    aiReason: "Missing owner, parent-service signal",
    aiRationale: "The parent Checkout service offering is owned by Checkout-Services, suggesting this dependency should be too.",
    aiConfidence: 69,
    recommendedOwner: group("Checkout-Services"),
    reviewStatus: "open",
    decision: null,
    decisionNotes: null,
    finalOwner: null,
    notes: null,
    identifiedDaysAgo: 1,
    updatedDaysAgo: 1,
  },
];

function toOwnershipIssue(seed: SeedIssue): OwnershipIssue {
  return {
    sys_id: seed.sys_id,
    number: seed.number,
    childCi: { sys_id: `ci-${seed.ciName}`, name: seed.ciName, ciClass: seed.ciClass },
    relationshipType: seed.relationshipType,
    currentOwner: seed.currentOwner,
    currentSupportGroup: seed.currentSupportGroup,
    managedBy: seed.managedBy,
    evidence: seed.evidence,
    aiReason: seed.aiReason,
    aiRationale: seed.aiRationale,
    aiConfidence: seed.aiConfidence,
    recommendedOwner: seed.recommendedOwner,
    reviewStatus: seed.reviewStatus,
    decision: seed.decision,
    decisionNotes: seed.decisionNotes,
    finalOwner: seed.finalOwner,
    notes: seed.notes,
    dateIdentified: daysAgo(seed.identifiedDaysAgo),
    created: daysAgo(seed.identifiedDaysAgo),
    createdBy: "ownership.detector",
    updated: daysAgo(seed.updatedDaysAgo),
    updatedBy: seed.decision ? "steward.review" : "ownership.detector",
  };
}

function seedActivity(issues: OwnershipIssue[]): ActivityEntry[] {
  const entries: ActivityEntry[] = [];
  let counter = 0;
  for (const issue of issues) {
    counter += 1;
    entries.push({
      id: `act-${counter}`,
      type: "recommendation_generated",
      issueNumber: issue.number,
      issueSysId: issue.sys_id,
      ciName: issue.childCi.name,
      message: `AI recommended ${issue.recommendedOwner?.name ?? "no owner"} with ${issue.aiConfidence}% confidence`,
      actor: "CMDBRelationshipAnalyzer",
      timestamp: issue.created,
    });
    if (issue.decision) {
      counter += 1;
      entries.push({
        id: `act-${counter}`,
        type: "decision_submitted",
        issueNumber: issue.number,
        issueSysId: issue.sys_id,
        ciName: issue.childCi.name,
        message: `Decision "${issue.decision}" submitted${issue.finalOwner ? ` — final owner ${issue.finalOwner.name}` : ""}`,
        actor: "steward.review",
        timestamp: issue.updated,
      });
      if (issue.finalOwner) {
        counter += 1;
        entries.push({
          id: `act-${counter}`,
          type: "ownership_changed",
          issueNumber: issue.number,
          issueSysId: issue.sys_id,
          ciName: issue.childCi.name,
          message: `CMDB support group updated to ${issue.finalOwner.name}`,
          actor: "OwnershipDecisionService",
          timestamp: issue.updated,
        });
      }
    }
  }
  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// Turbopack/webpack compile route handlers and Server Components as separate
// module graphs in dev, so a plain module-level `let` would give each graph
// its own copy of the seed data and mutations in one would be invisible to
// the other. Anchoring the mutable state on `globalThis` guarantees every
// bundle shares the exact same in-memory store within this Node process.
interface MockStore {
  issues: OwnershipIssue[];
  activityLog: ActivityEntry[];
}

declare global {
  var __ownershipMockStore: MockStore | undefined;
}

function getStore(): MockStore {
  if (!globalThis.__ownershipMockStore) {
    const seededIssues = SEED.map(toOwnershipIssue);
    globalThis.__ownershipMockStore = {
      issues: seededIssues,
      activityLog: seedActivity(seededIssues),
    };
  }
  return globalThis.__ownershipMockStore;
}

function matchesFilters(issue: OwnershipIssue, filters: IssueFilters): boolean {
  if (filters.status && issue.reviewStatus !== filters.status) return false;
  if (filters.confidence && confidenceLevel(issue.aiConfidence) !== filters.confidence) return false;
  if (filters.ciClass && issue.childCi.ciClass !== filters.ciClass) return false;
  if (filters.supportGroup) {
    const groupName = issue.currentSupportGroup?.name ?? "";
    if (groupName !== filters.supportGroup) return false;
  }
  if (filters.q) {
    const needle = filters.q.toLowerCase();
    const haystack = [
      issue.childCi.name,
      issue.currentOwner ?? "",
      issue.currentSupportGroup?.name ?? "",
      issue.recommendedOwner?.name ?? "",
      issue.number,
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

function toListItem(issue: OwnershipIssue): IssueListItem {
  return {
    sys_id: issue.sys_id,
    number: issue.number,
    ciName: issue.childCi.name,
    ciClass: issue.childCi.ciClass,
    currentOwner: issue.currentOwner,
    recommendedOwnerName: issue.recommendedOwner?.name ?? null,
    aiConfidence: issue.aiConfidence,
    reviewStatus: issue.reviewStatus,
    dateIdentified: issue.dateIdentified,
    currentSupportGroupName: issue.currentSupportGroup?.name ?? null,
  };
}

export function listIssues(filters: IssueFilters): IssueListItem[] {
  return getStore().issues.filter((i) => matchesFilters(i, filters)).map(toListItem);
}

export function getIssue(sysId: string): OwnershipIssue | null {
  return getStore().issues.find((i) => i.sys_id === sysId) ?? null;
}

export function getAllIssues(): OwnershipIssue[] {
  return getStore().issues;
}

export function listGroups(): GroupRef[] {
  return GROUPS;
}

export function listActivity(): ActivityEntry[] {
  return getStore().activityLog;
}

export function runDetection(): DetectionRunResult {
  const store = getStore();
  let created = 0;
  let skippedExisting = 0;

  for (const ci of RAW_MOCK_CIS) {
    if (ci.supportGroup) continue;

    const findingId = `detected-${ci.sys_id}`;
    if (store.issues.some((issue) => issue.sys_id === findingId)) {
      skippedExisting += 1;
      continue;
    }

    const ownerCounts = ci.relatedOwnerSignals.reduce<Record<string, number>>((counts, owner) => {
      counts[owner] = (counts[owner] ?? 0) + 1;
      return counts;
    }, {});
    const [recommendedOwnerName, supportingRelationships] = Object.entries(ownerCounts).sort(
      ([, a], [, b]) => b - a
    )[0];
    const recommendedOwner = group(recommendedOwnerName);
    const now = new Date().toISOString();
    const issue: OwnershipIssue = {
      sys_id: findingId,
      number: `OWN${String(store.issues.length + 1001).padStart(7, "0")}`,
      childCi: { sys_id: ci.sys_id, name: ci.name, ciClass: ci.ciClass },
      relationshipType: "missing_owner",
      currentOwner: null,
      currentSupportGroup: null,
      managedBy: ci.managedBy,
      evidence: [
        {
          type: "relationship_owner_majority",
          value: `${supportingRelationships} of ${ci.relatedOwnerSignals.length} related CIs are owned by ${recommendedOwnerName}`,
          weight: 60,
        },
      ],
      aiReason: "Missing owner derived from raw CI state",
      aiRationale: `${recommendedOwnerName} owns the majority of directly related CIs. Human approval is still required before any CMDB update.`,
      aiConfidence: 82,
      recommendedOwner,
      reviewStatus: "open",
      decision: null,
      decisionNotes: null,
      finalOwner: null,
      notes: "Created by on-demand rule-based detection from an unlabeled raw CI.",
      dateIdentified: now,
      created: now,
      createdBy: "ownership.detector",
      updated: now,
      updatedBy: "ownership.detector",
    };

    store.issues.unshift(issue);
    store.activityLog.unshift({
      id: `act-detected-${ci.sys_id}`,
      type: "recommendation_generated",
      issueNumber: issue.number,
      issueSysId: issue.sys_id,
      ciName: ci.name,
      message: `Rule-based detection found missing ownership; recommendation generated for ${recommendedOwnerName}`,
      actor: "OwnershipDetector",
      timestamp: now,
    });
    created += 1;
  }

  return {
    run_id: `mock-detection-${Date.now()}`,
    scanned: RAW_MOCK_CIS.length,
    created,
    skipped_existing: skippedExisting,
    source: "mock",
    message: created
      ? `Detection created ${created} new finding from unlabeled CI data.`
      : "Detection completed; every matching CI already has an open finding.",
  };
}

export class MockApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function submitDecision(sysId: string, payload: DecisionRequest): DecisionResponse {
  const store = getStore();
  const issue = store.issues.find((i) => i.sys_id === sysId);
  if (!issue) throw new MockApiError(404, "Issue not found");
  if (issue.reviewStatus === "resolved") {
    throw new MockApiError(409, "Issue already resolved");
  }

  let finalGroup: GroupRef | null = issue.recommendedOwner;
  if (payload.decision === "overridden") {
    if (!payload.final_group_id) throw new MockApiError(400, "final_group_id is required for an override");
    const overrideGroup = GROUPS.find((g) => g.sys_id === payload.final_group_id);
    if (!overrideGroup) throw new MockApiError(400, "Unknown final_group_id");
    finalGroup = overrideGroup;
  } else if (payload.decision === "accepted") {
    finalGroup = payload.final_group_id
      ? GROUPS.find((g) => g.sys_id === payload.final_group_id) ?? issue.recommendedOwner
      : issue.recommendedOwner;
  } else {
    finalGroup = null;
  }

  issue.decision = payload.decision;
  issue.decisionNotes = payload.notes ?? issue.decisionNotes;
  issue.reviewStatus = payload.decision === "deferred" ? "deferred" : "resolved";
  issue.updatedBy = "steward.review";
  issue.updated = new Date().toISOString();

  if (payload.decision !== "deferred" && finalGroup) {
    issue.finalOwner = finalGroup;
    issue.currentSupportGroup = finalGroup;
    issue.currentOwner = finalGroup.name;
  }

  const auditId = `audit-${issue.sys_id}-${Date.now()}`;
  store.activityLog = [
    {
      id: `act-decision-${auditId}`,
      type: "decision_submitted",
      issueNumber: issue.number,
      issueSysId: issue.sys_id,
      ciName: issue.childCi.name,
      message: `Decision "${payload.decision}" submitted${finalGroup ? ` — final owner ${finalGroup.name}` : ""}`,
      actor: "steward.review",
      timestamp: issue.updated,
    },
    ...(payload.decision !== "deferred" && finalGroup
      ? [
          {
            id: `act-owner-${auditId}`,
            type: "ownership_changed" as const,
            issueNumber: issue.number,
            issueSysId: issue.sys_id,
            ciName: issue.childCi.name,
            message: `CMDB support group updated to ${finalGroup.name}`,
            actor: "OwnershipDecisionService",
            timestamp: issue.updated,
          },
        ]
      : []),
    ...store.activityLog,
  ];

  return {
    issue_id: issue.sys_id,
    status: issue.reviewStatus,
    final_group_id: finalGroup?.sys_id,
    ci_updated: payload.decision !== "deferred",
    audit_record_id: auditId,
  };
}
