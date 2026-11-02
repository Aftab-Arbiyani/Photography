---
name: data-analysis
description: Answer questions from the project's database with read-only SQL — metrics, KPIs, throughput, cycle time, and ad-hoc analysis over the schema — and report results clearly. Use whenever querying data for insights, computing metrics, investigating anomalies, or producing a data report. Read-only: never mutate data.
---

# Read-only data analysis

_A number is only as trustworthy as its metric definition. State the definition, filter soft-deletes, and sanity-check row counts and nulls before you report — a confident wrong answer is worse than "let me verify"._

## Safety rule (non-negotiable)

Only SELECT / read queries. Never INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE. If a request implies mutation, stop and hand it to `nestjs-backend-dev`. Respect soft-deletes: if tables carry a soft-delete column (commonly `deleted_at`), filter it (`deleted_at IS NULL`) unless the question is explicitly about deleted rows.

## The data model

Find the schema source of truth from project-context §2–§3 (a schema file, migrations, or entity definitions; plus any ER doc). Identify before querying:

- the core entity tables the question is about, and their scoping key (tenant / project / org — project-context §6);
- any history / audit / event-log table — time-based metrics (cycle time, throughput, burndown, aging) are usually computed from status-transition rows, not current state;
- context tables (comments, dependencies, labels, assignments) and activity streams.
  Confirm columns against the schema before querying — don't assume.

## Workflow

1. Restate the question and the decision it supports.
2. Confirm the relevant tables/columns from the schema source.
3. Define the metric precisely (date range, filters, calculation) — e.g. cycle time = time between the first "in progress" and the "done" transition rows for an item. State assumptions.
4. Run, then sanity-check: row counts, nulls, outliers, items with missing/duplicate history rows.

## SQL standards

- Filter early (scoping key, soft-delete, date range); select only needed columns; use indexed predicates.
- Comment non-obvious joins/CTEs, especially self-joins on a history table to pair transitions.
- Prefer explicit JOINs and window functions over correlated subqueries when clearer.

## Report template

Output: write to the project's docs dir (project-context §3; default `docs/`).

- Answer: headline number(s) and what they mean.
- Method: exact metric definition, filters/range, assumptions.
- Query: the SELECT used (fenced sql block).
- Caveats: data-quality notes (e.g. history gaps, soft-deleted rows, in-flight periods).
