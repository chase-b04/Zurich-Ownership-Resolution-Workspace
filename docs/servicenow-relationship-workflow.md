# ServiceNow Self-Reference Relationship Workflow

The external application supports one deliberately narrow relationship action:
deleting a confirmed self-reference from `cmdb_rel_ci`. It never deletes either
endpoint CI.

## Detection

The relationship detector derives the issue from current relationship record
state:

```text
parent.sys_id == child.sys_id
```

Do not import or read a preassigned issue label. Deduplicate against open
findings using the relationship `sys_id` and issue type `self_reference`.

Create a finding with:

```json
{
  "issue_category": "relationship",
  "issue_type": "self_reference",
  "severity_score": 100,
  "severity_band": "Critical",
  "recommended_change": {
    "action": "delete_relationship",
    "relationship_sys_id": "<cmdb_rel_ci sys_id>",
    "relationship_type": "Depends on",
    "parent_ci": { "sys_id": "<ci sys_id>", "name": "<ci name>" },
    "child_ci": { "sys_id": "<same ci sys_id>", "name": "<same ci name>" }
  }
}
```

Return `recommended_change` from both list and detail endpoints. Returning it as
an object or JSON string is supported.

## Decision branch

For an accepted relationship finding, the external app sends:

```json
{
  "decision": "accepted",
  "relationship_action": "delete_relationship",
  "notes": "Optional reviewer rationale"
}
```

Before calling `deleteRecord()` in ServiceNow, the decision resource must:

1. Load the finding by `sys_id`.
2. Confirm its category is `relationship` and type is `self_reference`.
3. Parse the stored `recommended_change`; never accept a relationship `sys_id`
   supplied by the browser.
4. Load `cmdb_rel_ci` using the stored relationship `sys_id`.
5. Confirm the relationship still exists and parent equals child.
6. Confirm the requested action exactly matches `delete_relationship`.
7. Delete only the relationship record.
8. Resolve the finding and record actor, timestamp, relationship `sys_id`, and
   outcome in task history/work notes.

If the relationship is missing or changed since detection, return `409` and do
not mark the finding resolved. A deferred decision records the review outcome
without changing `cmdb_rel_ci`. Relationship overrides are intentionally not
supported in this first workflow.

## Response

Return the normal decision response with relationship status:

```json
{
  "issue_id": "<finding sys_id>",
  "status": "resolved",
  "ci_updated": false,
  "relationship_updated": true,
  "audit_record_id": "<audit sys_id>"
}
```
