# Ownership Resolution Workspace

## Task 5 – AI + CMDB Enterprise Solution

### Team Product Vision

The Ownership Resolution Workspace is a customer-facing decision-support application that helps CMDB stewards identify Configuration Items (CIs) with missing, ambiguous, or conflicting ownership and quickly resolve them using AI-assisted recommendations.

ServiceNow remains the system of record while the external application provides a modern, focused experience for investigation, evidence review, recommendation evaluation, and decision making.

---

# Customer Problem

Organizations often have CMDB records without a clear owner or support team.

Common issues include:

- Missing ownership assignments
- Conflicting ownership fields
- Stale support group assignments
- Poor CMDB governance
- Slow manual investigation

As CMDB environments grow, ownership reviews become increasingly difficult and time-consuming.

---

# Target User

### Primary User

CMDB Steward

### Secondary Users

- Service Owners
- Infrastructure Managers
- Platform Teams
- Governance Teams

---

# Desired Outcome

Reduce the time required to determine ownership of a CI by providing:

- Explainable AI recommendations
- Relationship-based evidence
- Human review workflows
- One-click CMDB updates

---

# Success Metrics

| Metric                      | Goal                   |
| --------------------------- | ---------------------- |
| Ownership review time       | Reduce by 50%          |
| Ownership coverage          | Increase to 95%+       |
| AI recommendation accuracy  | 80%+                   |
| Manual investigation effort | Reduce significantly   |
| Resolution cycle time       | Under 5 minutes per CI |

---

# Product Principles

The application follows the Task 5 requirements:

### 1. One Customer Decision

A steward determines who should own a CI.

### 2. One Trustworthy Evidence Path

Recommendations are backed by CMDB data.

### 3. One Live ServiceNow Roundtrip

External UI → REST API → ServiceNow → UI

### 4. One Explainable Recommendation

Every recommendation includes confidence and rationale.

### 5. One Human Feedback Moment

Users can:

- Accept
- Override
- Defer

recommendations.

---

# System Architecture

```text
External Application
        |
        V
Backend API Layer
        |
        V
Scripted REST API
        |
        V
ServiceNow
        |
        V
CMDB + AI Analysis
```

---

# Application Pages

## Dashboard

Route:

```text
/
```

Purpose:

Provide visibility into ownership issues across the CMDB.

### Widgets

- Total Issues
- Open Issues
- Resolved Issues
- Deferred Issues
- High Confidence Recommendations
- Medium Confidence Recommendations
- Low Confidence Recommendations

### Main Table

Columns:

- CI Name
- CI Class
- Current Owner
- Recommended Owner
- Confidence
- Review Status
- Date Found

### Filters

- Review Status
- Confidence Level
- CI Class
- Support Group

### Search

Search by:

- CI Name
- Owner
- Support Group
- Recommendation

---

## Ownership Investigation Page

Route:

```text
/issue/[sys_id]
```

Purpose:

Review a specific ownership issue.

### Section 1 – CI Details

Displays:

- CI Name
- CI Class
- Current Owner
- Managed By
- Current Support Group
- Date Identified

---

### Section 2 – AI Recommendation

Displays:

```text
Recommended Owner
Confidence Score
Recommendation Status
```

Confidence Badge:

- High
- Medium
- Low

---

### Section 3 – Evidence Panel

Displays recommendation evidence:

Examples:

```text
Manager belongs to Payments Team

4 similar databases owned by Payments Team

Parent application owned by Payments Team

Relationship path suggests ownership
```

---

### Section 4 – AI Explanation

Displays:

```text
AI Reason
AI Rationale
```

Example:

```text
Payments Team is recommended because
the majority of similar database CIs are
owned by Payments Team and the assigned
manager belongs to Payments Team.
```

---

## Decision Workspace

Available actions:

### Accept Recommendation

One-click acceptance.

### Override Recommendation

Select another support group.

### Defer Review

Postpone decision.

### Add Decision Notes

Capture rationale.

---

## Analytics Page

Route:

```text
/analytics
```

Purpose:

Provide governance-level reporting.

### Charts

#### Ownership Issues by CI Class

- Database
- Server
- Application
- Network

#### Recommendation Confidence

- High
- Medium
- Low

#### Recommendation Distribution

Recommendations grouped by team.

#### Resolution Trends

Issues resolved over time.

---

## Activity History Page

Route:

```text
/activity
```

Shows:

- Recommendations generated
- Decisions submitted
- Ownership changes
- Review history

---

# REST API Design

---

## GET /issues

Purpose:

Retrieve ownership issues.

Response:

```json
{
  "items": []
}
```

Used By:

- Dashboard
- Analytics

---

## GET /issues/{sys_id}

Purpose:

Retrieve issue details.

Includes:

- CI details
- Evidence
- Recommendation
- Confidence
- AI rationale

Used By:

- Investigation Page

---

## GET /groups

Purpose:

Retrieve assignable groups.

Used By:

- Override Decision Workflow

---

## PATCH /issues/{sys_id}/decision

Purpose:

Submit review decision.

Supports:

```json
{
  "decision": "accepted"
}
```

```json
{
  "decision": "overridden"
}
```

```json
{
  "decision": "deferred"
}
```

Result:

- Issue updated
- CMDB updated
- Audit history updated

---

# Recommended Additional Endpoints

## GET /dashboard

Returns summary metrics.

```json
{
  "open": 12,
  "resolved": 7,
  "deferred": 3,
  "highConfidence": 9
}
```

---

## GET /analytics

Returns chart data.

```json
{
  "byConfidence": [],
  "byClass": [],
  "byTeam": []
}
```

---

## GET /activity

Returns recent actions.

```json
{
  "items": []
}
```

---

# Authentication Strategy

## For Demo

Simple API Key Authentication.

```text
X-API-Key
```

stored in backend environment variables.

---

## For Production

Recommended:

### Microsoft Entra ID (Azure AD)

Benefits:

- Enterprise standard
- Single Sign-On
- Role-based access
- Secure

Supported by:

- NextAuth
- Auth.js
- Microsoft Identity Platform

---

# Authorization Model

## CMDB Steward

Can:

- View Issues
- Accept Recommendations
- Override Recommendations
- Defer Recommendations

---

## Viewer

Can:

- View Dashboard
- View Evidence

Cannot:

- Submit Decisions

---

# Technology Stack

## Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts

---

## Backend

Option A (recommended)

Next.js API Routes

```text
/api/*
```

---

Option B

Express.js API Layer

---

## ServiceNow Integration

Scripted REST APIs

```text
GET /issues
GET /issues/{sys_id}
GET /groups
PATCH /issues/{sys_id}/decision
```

---

# Environment Variables

```env
SERVICENOW_URL=
SERVICENOW_USERNAME=
SERVICENOW_PASSWORD=

API_BASE_URL=

NEXTAUTH_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
```

Never expose ServiceNow credentials to the browser.

---

# Security Requirements

Must:

✅ Keep ServiceNow credentials server-side

✅ Use HTTPS

✅ Validate all requests

✅ Restrict decision APIs

✅ Audit all ownership updates

✅ Log all failures

Must Not:

❌ Store credentials in React

❌ Call ServiceNow directly from browser

---

# ServiceNow System of Record Responsibilities

ServiceNow owns:

- CMDB records
- Ownership records
- AI recommendations
- Evidence
- Audit history
- Review decisions

The external application only visualizes and interacts with data.

---

# Human Decision Flow

```text
Issue Detected
      |
      V
Recommendation Generated
      |
      V
Evidence Presented
      |
      V
Human Reviews
      |
      V
Accept / Override / Defer
      |
      V
Decision Written to ServiceNow
      |
      V
CMDB Updated
```

---

# Vercel Deployment Plan

## Step 1

Create GitHub Repository

```text
ownership-resolution-workspace
```

---

## Step 2

Build Next.js Application

Pages:

```text
/
/issues
/issues/[id]
/analytics
/activity
```

---

## Step 3

Create API Routes

```text
/api/issues
/api/issues/[id]
/api/groups
/api/dashboard
/api/analytics
/api/activity
```

These routes communicate with ServiceNow.

---

## Step 4

Push to GitHub

```bash
git add .
git commit -m "Initial Ownership Workspace"
git push
```

---

## Step 5

Import Repository into Vercel

```text
New Project
→ Import GitHub Repo
```

---

## Step 6

Add Environment Variables

Vercel Dashboard

```text
Settings
→ Environment Variables
```

Add:

```env
SERVICENOW_URL
SERVICENOW_USERNAME
SERVICENOW_PASSWORD
```

---

## Step 7

Deploy

Vercel automatically builds:

```bash
npm run build
```

and publishes:

```text
https://ownership-workspace.vercel.app
```

---

# Demo Story

1. Dashboard loads ownership issues.
2. User opens an issue.
3. User reviews evidence.
4. AI recommendation is displayed.
5. User accepts recommendation.
6. API calls ServiceNow.
7. ServiceNow updates CMDB.
8. UI immediately reflects updated status.
9. Activity history records decision.
