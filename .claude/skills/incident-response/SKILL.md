---
name: incident-response
description: Triage and resolve a production incident — assess impact, locate the cause (logs/metrics/recent deploys), decide hotfix vs rollback, and capture a post-mortem. Use whenever something is broken in production or during an outage.
---

# Incident response

_Mitigate first, understand later — restore service, then find root cause. Rollback usually beats a heroic hotfix under pressure, but check the schema first: code can roll back onto a forward-migrated database and make things worse._

Project facts (probes, CI, deploy, schema rollout, observability) come from project-context §5 and §9; they override anything generic here.

## Triage workflow

1. Assess severity and blast radius: who/what is affected, how badly, is data at risk. Hit the health and readiness probes (project-context §5) first — a readiness probe that reports per-dependency status (DB, object storage, queue, cache) often localizes the fault.
2. Locate the cause: check recent deploys (the CI/deploy pipeline from project-context §9), backend logs (where the global exception filter logs unexpected errors), and error rates around the onset time. Common suspects: DB connectivity, object storage, a schema change applied to one environment but not another, scheduled jobs/cron, inbound webhooks under load, and recent config/env changes.
3. Form a hypothesis tying the symptom to a likely change or fault before acting.

## Hotfix vs rollback

Prefer rollback if a recent deploy is the likely cause and rolling back is safe. **Watch the schema:** if schema changes ship separately from code (project-context §9 schema rollout — especially when applied out-of-band without a migration tool), a code rollback can land on a forward-migrated database — confirm the schema is compatible before reverting. Hotfix only with a tested fix (a hotfix branch per project-context §8) — never ship an unverified patch to prod.

## During the incident

Communicate status regularly (start, mitigation in progress, resolved). Do not make unreviewed prod changes beyond the agreed mitigation. Keep a running timeline as you go.

## Post-mortem template

```md
# <Incident> — Post-mortem

- Timeline: <onset -> detection -> mitigation -> resolution>
- Impact: <who/what, duration, severity>
- Root cause: <the actual fault>
- What fixed it: <mitigation / fix applied>
- Action items: <preventive follow-ups, owners>
```
