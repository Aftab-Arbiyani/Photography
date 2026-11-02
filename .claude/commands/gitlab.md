---
description: Generate or update the CI pipeline for the project's CI system (GitLab CI or GitHub Actions, per project-context §9) via deployment-engineer
argument-hint: [optional: stages or changes to make]
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
---

# CI pipeline: $ARGUMENTS

Use the deployment-engineer subagent to create or update the pipeline for the CI system named in project-context §9.

**Project facts:** load `project-context` first. Needs §4 (install / lint / type-check / test / build commands and the gate set), §8 (integration and release branches, merge policy) and §9 (CI system, pipeline layout, deploy targets, environments). If §9 is missing, detect the CI system from the repo and say what you assumed.

Two supported shapes — keep whichever layout the repo already uses:

- **GitLab CI** — `.gitlab-ci.yml` entrypoint, optionally split into per-concern `include:` files (e.g. under `.gitlab/ci/`: deploy-staging, deploy-production, smoke). Gate merge requests via pipeline status; protected environments + manual jobs for prod.
- **GitHub Actions** — workflows under `.github/workflows/*.yml` (e.g. `ci.yml` on `pull_request`/`push`, separate `deploy-*.yml`). Gate PRs via required status checks; GitHub Environments with required reviewers for prod.

1. Inspect first — package manager, existing scripts, and the current pipeline files — before changing anything.
2. Build a fast, deterministic pipeline in stage order: `install` (cached) → `lint` → `typecheck` → `test` → `build`, using the commands from project-context §4. Cache dependencies, fail fast, and gate merge/pull requests on green.
3. Make production deploy a **separate manual job behind a protected environment with required approvers** — never auto-deploy. Keep secrets in masked/protected CI variables (GitLab) or encrypted secrets (GitHub), never in the file.

Validate the YAML (`glab ci lint` for GitLab; `actionlint` if available for GitHub), summarize the stages and the CI variables/secrets it needs, and flag any manual steps. Do not push or trigger a deploy.
