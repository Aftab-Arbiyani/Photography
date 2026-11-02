---
description: Validate the .claude/agents tree — frontmatter completeness, that every agent's skills/tools/model resolve, and that read-only roles carry no write tools
argument-hint: (none)
allowed-tools: Read, Grep, Glob, Bash
---

# Validate Claude Agents

Validate the `.claude/agents` tree and report the result. Run the project's agent validator first if project-context §4 names one, then run the explicit sweeps below (they also cover checks the validator may not).

```bash
# replace <agent-validator-cmd> with the validator from project-context §4, if any
<agent-validator-cmd> 2>/dev/null || echo "no agent validator — running the manual sweeps below"
```

If validation fails, fix the agent metadata before relying on orchestration.

## Structural checks (validator or manual)

- Every direct `.md` child of `.claude/agents/` except `README.md` has frontmatter.
- Every agent has `name`, `description`, `tools`, `model`, and `skills` (an empty skills list is acceptable only for a narrow utility agent with no domain knowledge to load).
- Descriptions are one to three sentences — long enough for the router to pick the right agent, short enough to scan (aim under ~500 characters).
- Every agent listed in the README routing matrix exists as a file, and every agent file appears in the README.

## Extended checks (run these sweeps explicitly)

1. **`skills:` resolve to real directories.** For every agent that declares a `skills:` list, each entry must be a real directory under `.claude/skills/`. Expected skill names: `project-context` (every agent lists it first), `nestjs-conventions`, `reactjs-conventions`, `code-review`, `security-audit`, `performance-profiling`, `db-schema-design`, `test-strategy`, `test-execution`, `project-scoping`, `sprint-planning`, `task-tracking`, `technical-design`, `requirements-doc`, `ux-spec`, `a11y-audit`, `release-process`, `incident-response`, `research-synthesis`, `documentation`, `cicd-pipeline`, `data-analysis`, `codebase-exploration`, `orchestration-playbook`.

   ```bash
   # list every skills: entry, then flag any that lack a matching directory
   for a in .claude/agents/*.md; do
     [ "$(basename "$a")" = "README.md" ] && continue
     awk '/^skills:/{f=1;next} f&&/^[a-z_]+:/{f=0} f&&/^[[:space:]]*-/{sub(/^[[:space:]]*-[[:space:]]*/,"");print FILENAME": "$0}' "$a"
   done | while IFS=': ' read -r file skill; do
     [ -d ".claude/skills/$skill" ] || echo "MISSING SKILL DIR: $file -> $skill"
   done
   ```

2. **Every agent declares `tools:` and `model:`.** Flag any agent missing either key.

   ```bash
   for a in .claude/agents/*.md; do
     [ "$(basename "$a")" = "README.md" ] && continue
     grep -q '^tools:'  "$a" || echo "NO tools:  $a"
     grep -q '^model:'  "$a" || echo "NO model:  $a"
   done
   ```

3. **Read-only roles carry no write tools.** The read-only roster — `code-reviewer`, `security-reviewer`, `pre-release-auditor`, `performance-optimizer`, `qa-lead`, `business-analyst`, `incident-commander`, `explorer`, `diff-reviewer`, `data-analyst`, `test-runner` — must **not** list `Edit`, `Write`, or `NotebookEdit` in `tools:`. (`qa-backend`, `qa-frontend`, and `ux-designer` are deliberately read-write: they author tests and spec files.) Flag violations.

   ```bash
   for a in code-reviewer security-reviewer pre-release-auditor performance-optimizer qa-lead business-analyst incident-commander explorer diff-reviewer data-analyst test-runner; do
     f=".claude/agents/$a.md"; [ -f "$f" ] || continue
     grep -E '^tools:' "$f" | grep -Eq '(Edit|Write|NotebookEdit)' && echo "WRITE TOOL ON READ-ONLY ROLE: $f"
   done
   ```

## Report

Summarize per check: pass, or the exact list of offending agent files with the missing/invalid field. If any check fails, list the fixes needed (add `model:`, add the missing skill directory or correct the typo'd skill name, strip write tools from a read-only role) before orchestration should rely on the tree.
