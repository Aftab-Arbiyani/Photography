---
description: Prepare a release — verify, version, changelog, go/no-go, rollback plan (does not deploy)
argument-hint: [version, or "auto" to infer]
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
disable-model-invocation: true
---

# Cut release: $ARGUMENTS

Prepare (do NOT deploy) a release. The production deploy and tag push are gated to the deployment-engineer with human approval — follow the branch → MR/PR → merge → tag sequence from project-context §8 (and the git rulebook from project-context §7, if present).

Context:

- Current version: !`grep '"version"' package.json 2>/dev/null | head -1 || true; test -f package.json || echo '(no package.json found — confirm the version source before tagging)'`
- Changes since last tag: !`last=$(git describe --tags --abbrev=0 2>/dev/null); git log ${last:+$last..}HEAD --oneline 2>/dev/null | head -50; test -n "$last" || echo '(no prior tag — listing all history; this would be the first release)'`

Steps:

1. test-writer subagent: confirm the gate set from project-context §4 is green.
2. security-reviewer subagent: confirm no Critical/High issues in sensitive changes (auth, uploads, data-access scoping, any externally exposed API/MCP surface).
3. release-manager subagent: decide the semver bump (use "$ARGUMENTS" if a version was given, else infer from the changes), update the changelog, run the pre-release checklist, give a go/no-go, and write a rollback plan.

If GO: produce the tag, release notes, and a deploy runbook for the deployment-engineer (respect the CI/deploy gating in project-context §9, e.g. manual/protected deploy jobs). If NO-GO: list the blockers. Do not push tags or deploy.
