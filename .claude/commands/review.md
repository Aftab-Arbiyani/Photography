---
description: Review a diff, branch, file, or implementation scope in the current project.
argument-hint: <diff, file path, branch, or scope>
---

Use `.claude/agents/code-reviewer.md` as the primary role definition.
Use `.claude/agents/diff-reviewer.md` when the request is limited to a narrow diff or file.

Review target:
$ARGUMENTS

Lead with findings ordered by severity. Include file/line references where possible, then open questions and a brief residual-risk note. Focus on correctness, RBAC, auditability, data access, migrations, theming/dark mode (if supported), tests, and release risk. Apply the project rules in project-context §6.
