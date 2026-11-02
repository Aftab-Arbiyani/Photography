---
name: release-process
description: Cut a release — decide the semver bump, generate changelog/release notes, run the pre-release checklist, give a go/no-go, and prepare a rollback plan. Use whenever preparing a release, writing release notes, or versioning. Prepares and recommends; the production deploy is gated to CI + human approval.
---

# Release process

_The rollback plan is the release. A deploy you can't cleanly undo is a bet, not a release — and if schema changes ship separately from code, confirm the database and the code can each roll back independently before you say GO._

Commands, git flow, CI, and schema rollout come from project-context §4, §8, and §9; they override the defaults below.

## Semver

MAJOR breaking; MINOR backward-compatible feature; PATCH fix. A breaking change is a major bump even if small.

## Pre-release checklist

- [ ] The gate set from project-context §4 is green (type-check/lint, backend + frontend tests, build)
- [ ] Health and readiness probes (project-context §5) OK on a running build
- [ ] code-reviewer signed off
- [ ] security-reviewer clear (for auth/upload/data changes)
- [ ] Schema changes captured with rollout + rollback steps (migration `down()` or rollback SQL) and applied to the target environment per project-context §9
- [ ] If the project has lockstep persistence rules (project-context §6), every place they name is updated for any newly persisted data (else writes can silently drop)
- [ ] Env/config changes documented; CORS allow-list and secrets reviewed
- [ ] CHANGELOG / docs updated

## Git flow

Follow the branch model in project-context §8. Default: merge feature/bugfix/chore branches into `<integration-branch>` via MR/PR (never commit to it directly); release branches or tags for versioned cuts; hotfix branches from the release branch. Branch prefix per ticket type and ID format per project-context §7–§8.

## Changelog format (Keep a Changelog)

Group under: Added / Changed / Fixed / Security / Breaking. Write for the audience (user-facing vs internal). Update `CHANGELOG.md` (or the project's equivalent).

## Go/no-go

Recommend GO only if the checklist passes; otherwise list blockers. Never ship with failing tests or an un-applied/irreversible schema change.

## Rollback plan template

(see `db-schema-design` for schema rollback)

- Revert: <tag/commit, or redeploy previous build via the CI from project-context §9>
- Data: <undo/compensate the schema change — is it safe?>
- Verify after rollback: <health/readiness probes + smoke checks>

## Boundary

Prepare the tag, notes, and runbook; the production deploy is executed by the CI/deploy pipeline from project-context §9 (typically a manual, approval-gated job) with human approval — see `cicd-pipeline`.
