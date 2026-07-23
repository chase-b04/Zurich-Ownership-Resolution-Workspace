# Ownership Resolution Workspace

Task 5 – AI + CMDB Enterprise: an external decision-support UI for reviewing
CMDB configuration items with missing, ambiguous, or conflicting ownership.
ServiceNow remains the system of record; see [planning.md](planning.md) for
the full product spec and
[servicenow_cmdb_ownership_implementation_plan.md](servicenow_cmdb_ownership_implementation_plan.md)
for the ServiceNow-side build (tables, script includes, Scripted REST API).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without any ServiceNow
env vars configured, the app runs entirely on an in-memory mock data set
(`lib/servicenow/mock-store.ts`) so the UI works standalone.

## Connecting to a real ServiceNow instance

Copy `.env.example` to `.env.local` and fill in:

```env
SERVICENOW_URL=https://your-instance.service-now.com
SERVICENOW_USERNAME=
SERVICENOW_PASSWORD=
SERVICENOW_API_PATH=/api/x_cmdb_ownership/ownership
# Set only after POST /detection/run exists in the Scripted REST API.
SERVICENOW_DETECTION_ENABLED=false
```

Once all three of `SERVICENOW_URL`/`SERVICENOW_USERNAME`/`SERVICENOW_PASSWORD`
are set, `lib/servicenow/client.ts` calls the real Ownership API
(`GET /groups`, `GET /issues`, `GET /issues/{sys_id}`,
`PATCH /issues/{sys_id}/decision`, `POST /detection/run`) instead of the mock store. Credentials are
only ever read server-side (API routes and Server Components) — the browser
never talks to ServiceNow directly.

The Ownership API doesn't expose dedicated dashboard/analytics/activity
endpoints, so those views are computed in `lib/servicenow/derive.ts` from the
issue list on every request.

## Auth

Demo-tier auth per planning.md's "Simple API Key Authentication": set
`STEWARD_API_KEY`, `VIEWER_API_KEY`, and `SESSION_SECRET` in `.env.local`
(defaults are already filled in for local dev — change them before sharing
the app). Signing in with either key exchanges it for a signed, httpOnly
session cookie; `proxy.ts` gates every route behind having a valid session,
redirecting unauthenticated page requests to `/login` and returning `401` for
unauthenticated API calls.

Two roles, matching the Authorization Model in planning.md:

- **Steward** — full access, can accept/override/defer recommendations.
- **Viewer** — read-only; the decision UI is hidden and
  `PATCH /api/issues/{id}/decision` returns `403` even if called directly.

Swapping to Microsoft Entra ID for production only means replacing
`lib/auth/session.ts` + the `/login`/`/api/auth/*` routes — everything else
(`proxy.ts`, the role checks in route handlers and components) keys off the
same `Role` type and doesn't change.

## Structure

```
app/
  page.tsx                    Dashboard
  issue/[sys_id]/page.tsx     Ownership Investigation page
  analytics/page.tsx          Governance analytics
  activity/page.tsx           Activity history
  api/                        Route handlers proxying to the ServiceNow client
lib/
  types.ts                    Domain types mirroring the CMDB Ownership table
  servicenow/client.ts        Live vs. mock ServiceNow integration layer
  servicenow/mock-store.ts    Seed data + in-memory mutation for local demos
  servicenow/derive.ts        Dashboard/analytics/activity aggregation
  auth/session.ts             Demo-tier session signing/verification + roles
components/                   UI (Tailwind, hand-rolled shadcn-style primitives)
proxy.ts                       Route gate: requires a valid session cookie
```

## Notes

- The mock store resets whenever the dev server restarts.
- Live detection requires a `POST /detection/run` Scripted REST resource. It must scan
  raw CMDB records, derive findings from current field values, deduplicate
  open findings, and return `{ run_id, scanned, created, skipped_existing, message }`.
  Until that resource is installed and `SERVICENOW_DETECTION_ENABLED=true`, the
  dashboard shows a safe **Refresh findings** action instead.
- Relationship findings may return a structured `recommended_change`. The supported
  workflow is deliberately narrow: a steward can approve deletion of a confirmed
  self-reference in `cmdb_rel_ci`, while neither endpoint CI is modified or deleted.
  See `docs/servicenow-relationship-workflow.md` for the ServiceNow resource contract.
- Auth is demo-tier only (see above) — replace it with Entra ID/NextAuth
  before any real production exposure.
