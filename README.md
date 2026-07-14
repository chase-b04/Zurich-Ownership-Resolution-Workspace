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
```

Once all three of `SERVICENOW_URL`/`SERVICENOW_USERNAME`/`SERVICENOW_PASSWORD`
are set, `lib/servicenow/client.ts` calls the real Ownership API
(`GET /groups`, `GET /issues`, `GET /issues/{sys_id}`,
`PATCH /issues/{sys_id}/decision`) instead of the mock store. Credentials are
only ever read server-side (API routes and Server Components) — the browser
never talks to ServiceNow directly.

The Ownership API doesn't expose dedicated dashboard/analytics/activity
endpoints, so those views are computed in `lib/servicenow/derive.ts` from the
issue list on every request.

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
components/                   UI (Tailwind, hand-rolled shadcn-style primitives)
```

## Notes

- Auth (API key for demo, Microsoft Entra ID for production) described in
  planning.md is not wired up yet — add it before exposing this beyond local
  use.
- The mock store resets whenever the dev server restarts.
