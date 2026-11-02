---
name: cicd-pipeline
description: Work on the project's CI/CD pipeline (GitLab CI or GitHub Actions) — pipeline layout and modules, merge-request/PR gating, security scans, and deploy/migrate/smoke stages. Use whenever adding or fixing a CI job, tuning the pipeline gates, or changing a deploy step.
---

# CI/CD

_A pipeline that's green but skips the real gate is theatre. Keep production manual, keep the schema step honest (if schema is applied out-of-band, the migrate step is a no-op by design — don't dress it up as a migration), and make every failure point at the exact stage that broke._

## Orient first

Read project-context §8 (git host, branches) and §9 (CI, deploy, schema rollout, observability). If missing, read the CI config itself (`.gitlab-ci.yml` + includes, or `.github/workflows/*`) and say what you assumed.

## Layout (edit the module, not the manifest)

If the pipeline is modular — a top-level manifest that declares stages and `include:`s focused modules (GitLab), or reusable workflows/composite actions (GitHub) — put each job in the module that owns its concern (common rules/anchors, backend, frontend, security, deploy per environment, smoke, ops). Keep shared rules/anchors in the common module and reuse them. A typical stage order: `lint → build → test → security → backup → deploy → migrate → smoke`.

## Gating policy (the important part)

Know and preserve the project's gating policy (project-context §9): which jobs run automatically on MR/PR pipelines, which run on merge to `<integration-branch>`, and which are manual. Production deploy should be a manual/approval-gated job (GitLab `when: manual` / protected environment; GitHub environment required reviewers). Keep new jobs consistent with the shared rules — don't silently make a gated job auto-run, and don't mark a real gate `allow_failure`/`continue-on-error` without saying so.

## Deploy model

Follow the deploy model in project-context §9 (SSH runner + process manager + reverse proxy, containers, or a platform). Keep environment-specific values (deploy path, app name, public URLs) as environment-scoped CI variables, set once per environment, rather than branching in scripts.

## Schema migrations

Wire schema rollout the way project-context §9 says. With a migration tool: run migrations in the migrate stage after backup, idempotently, with a tested `down()`. Without one (schema applied out-of-band): keep the migrate job an honest placeholder — run a `migrate` script if one exists, else log that schema is managed out-of-band — and never re-apply a non-idempotent schema file.

## Config & secrets

CI variables live in the host's settings (GitLab CI/CD variables, GitHub secrets/environments), masked and protected. Never commit secrets. Least-privilege tokens; test DB credentials scoped to what the test job needs.

## Deploy safety

Reversible/idempotent steps; back up the database before a deploy that can touch schema; run smoke checks after; have a restart/rollback path. Keep the production gate manual.
