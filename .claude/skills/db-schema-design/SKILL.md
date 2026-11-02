---
name: db-schema-design
description: Design database schema changes, indexes, and rollouts for a PostgreSQL project — data model, constraints, normalization, indexing for real query patterns, and safe rollout via the project's migration mechanism (ORM migrations or hand-written SQL). Use whenever modeling data, changing a table, choosing indexes, or planning a schema change.
---

# Database schema & rollout design

_A constraint you skip today is a data-cleanup job next quarter. Enforce invariants in the schema, index for the query you'll actually run (not the one you imagine), and write the rollback before the forward change._

## The rollout reality (read first)

Find out how schema reaches each environment (project-context §2 and §9; else inspect the repo for a migrations folder, ORM config `synchronize`/`migrationsRun`, or a schema file):

- **ORM migrations** (TypeORM/Prisma/Knex): a change = a new migration with a correct `up()` and `down()`; never edit an applied migration. Have `migration-reviewer` gate it.
- **Schema file applied out-of-band** (no migration tool): a change = edit the schema file, write the incremental forward SQL AND rollback SQL by hand, and coordinate the per-environment apply. Nothing auto-backfills.
  Never rely on `synchronize: true` outside throwaway local DBs.

## Persistence wiring you must keep in sync

A new/changed table only reaches the app if the persistence layer knows about it: register the entity where the project registers entities, or add parameterized raw-SQL access where the project uses it. If project-context §6 names lockstep persistence pieces (entity registries, state builders/writers, change-detection signatures), update every one — a missed one can silently drop writes.

## Schema conventions

Follow the project's conventions (project-context §6, or the docs/ER notes in project-context §3). Sound defaults when none are stated:

- UUID (or bigint identity) primary key on every table, consistent with neighbours.
- FKs named `<table>_id` with an explicit `ON DELETE` and an index.
- `created_at`/`updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`; `deleted_at TIMESTAMPTZ NULL` if the project soft-deletes.
- Tenant/scope key on tenant-owned tables if the project is multi-tenant.
- JSONB only where data is genuinely unstructured (small metadata bags).

## Workflow

1. Derive entities/attributes/relationships from the requirement and the current schema.
2. Enforce invariants in the schema (keys, unique, check, NOT NULL, defaults) — a DB constraint beats an app check.
3. Index for actual query patterns; weigh write cost.
4. Write forward AND rollback; for a large table prefer nullable-add-then-backfill (batched), `CREATE INDEX CONCURRENTLY`, and `ADD CONSTRAINT ... NOT VALID` + `VALIDATE`.

## Design template

Output: write to the project's docs location (project-context §3).

- Entities: <name: fields(type); PK; FKs> (follow the conventions above)
- Relationships: <A 1—\* B ...>
- Constraints: <unique/check/nullability/defaults>
- Indexes: <table(cols) — serves which query>
- Persistence: entity registration or raw-SQL access; lockstep entries per project-context §6
- Rollout: <migration or forward SQL> / <down or rollback SQL> — online-safe? <y/n + how>
- Volume & hot queries: <...>

## Principles

Normalize by default; denormalize only with a justifying read pattern. Match the existing naming/key conventions — read neighbouring tables before proposing a new one.
