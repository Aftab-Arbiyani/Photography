---
description: Act as the repository orchestrator — pick a coordination mode, partition ownership across specialists, run them in parallel/sequence, and integrate into one plan or patch
argument-hint: <request to orchestrate>
allowed-tools: Read, Grep, Glob, Bash, Task, Agent
---

# Orchestrate

User request:

```text
$ARGUMENTS
```

Act as the advanced repository orchestrator for this request.

1. Read `CLAUDE.md` (primary Claude-facing guide: commands, architecture, project rules), `.claude/agents/README.md`, and `.claude/agents/orchestrator.md`.
2. Choose the coordination mode: Quick Route, Feature Squad, Full Council, Release Train, Incident Room, Audit Baseline, or Migration Program.
3. If the request says "all agents", "advanced", "whole app", "full review", "release readiness", or spans many domains, use Full Council Mode.
4. Build a shared context packet for every selected specialist: request, mode, scope, task, allowed edits, required output, and constraints.
5. Use the Agent tool with `subagent_type: <name>` for specialist work.
6. Run independent specialist tasks in parallel where possible. Run dependent tasks in sequence.
7. Assign exactly one writer per file/module. Keep read-only roles read-only.
8. Integrate results into one response or one patch. Do not paste raw agent transcripts.
9. For non-trivial code changes, include `code-reviewer`. For auth, webhook, HTML, secrets, subprocess, DB, or data-boundary changes, include `security-reviewer`.
10. Preserve the repository constraints from `CLAUDE.md` and `AGENTS.md`, and avoid touching unrelated dirty files.

If implementation is requested, proceed with the implementation after orchestration. If the request is only for planning or review, stop after the integrated plan or findings.
