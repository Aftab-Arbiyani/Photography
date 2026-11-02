---
description: Publish one ticket (ready_for_publish → done) — push, MR/PR to the integration branch, merge (if pre-authorized), capture PoD, append_merge_info, flip done
argument-hint: <ticket-id>
allowed-tools: Bash, Read, Grep, mcp__project-manager__get_ticket, mcp__project-manager__update_ticket, mcp__project-manager__update_ticket_status, mcp__project-manager__add_ticket_comment, mcp__project-manager__log_ticket_time, mcp__project-manager__append_merge_info, mcp__project-manager__upload_proof_of_done, mcp__project-manager__list_tickets
---

You are publishing a ticket — the `ready_for_publish → done` transition — on the live board via the tracker MCP. Requires the tracker MCP named in project-context §7. Rulebook: the workflow rulebook from project-context §7 (if present), plus any git-workflow notes in §8.

Ticket: $ARGUMENTS

## Project facts

Load `project-context` first. This command needs:

- **§5** — frontend/backend URLs and the test-account env vars (and whether login needs OTP/SSO) for the PoD capture.
- **§7** — tracker MCP + project selection, ticket ID format, agent identity, PoD rules (required kinds, framing/script paths, artifact dir, upload limits, status/actor gates, any direct-upload fallback endpoint), workflow rulebook.
- **§8** — git host + CLI (`glab` for GitLab, `gh` for GitHub), repo, integration branch, release branch, merge policy, MR/PR title format.

Rules that follow from those facts:

- Use the project selected per project-context §7 — do not switch projects.
- Merge target is the **integration branch** only. Promotion to the release branch + tags are explicit-request-only — never push a tag here.
- Merge without prompting **only if project-context §8 says agent merges into the integration branch are pre-authorized; otherwise ask** for a per-MR yes before Step 4.
- Never write a literal credential — log in with the test account env vars from project-context §5.
- Only act when `get_ticket` shows `status="ready_for_publish"` and a QA `test_report`. If not, stop and report the actual state.

## Step 1 — Pre-flight

```bash
git status --porcelain          # working tree must be clean
git rev-parse --abbrev-ref HEAD # must be the ticket's branch, not the integration/release branch
git log -1 --oneline
```

- Dirty tree → **stop**, surface the diff; do not improvise.
- On the integration or release branch → **stop**; this runs from the ticket's branch (named per project-context §8).

## Step 2 — Push the branch

```bash
git push -u origin <current-branch>
```

Push fail → stop and surface the error verbatim.

## Step 3 — Open the MR/PR to the integration branch

GitLab:

```bash
glab mr create --target-branch <integration-branch> --source-branch <current-branch> \
  --title "<ticket-id>: <one-line summary>" \
  --description "Closes <ticket-id>

Summary:
- ...

Verification:
- QA pass N/N (see ticket test_report)"
```

GitHub: `gh pr create --base <integration-branch> --head <current-branch> --title "<ticket-id>: <one-line summary>" --body "<same body>"`.

Use the title format from project-context §8 if it defines one. Capture the **MR/PR number `<N>`** and URL. If one already exists for the branch, reuse it.

## Step 4 — Merge to the integration branch

```bash
glab mr merge <N> --remove-source-branch --yes   # GitLab
gh pr merge <N> --delete-branch --merge          # GitHub (strategy per project-context §8)
```

Pre-authorized per project-context §8 → no prompt. Not pre-authorized → ask first and wait.

## Step 5 — Confirm the integration branch advanced + capture the merge SHA

```bash
git fetch origin <integration-branch> && git log origin/<integration-branch> -1 --oneline
```

Poll until the merge commit lands on `origin/<integration-branch>`; capture the full merge SHA. Do not report "merged" until the branch shows the commit.

## Step 6 — Capture + upload Proof-of-Done (REQUIRED)

Upload every PoD kind project-context §7 requires before `done` (kit default: dual-kind `evidence` + `fixed`). Artifacts go under the PoD artifact dir from project-context §7 (gitignored, per ticket) — never system `/tmp`.

1. **Real screenshot of the running app.** Drive the live app at the frontend URL from project-context §5 (log in with the test-account env vars from §5) via Playwright or the browser MCP tools; navigate to the shipped surface; capture a full-page screenshot. Never a synthetic/canvas image, never a 1×1 placeholder, and capture **after** the merge lands. Backend/docs-only tickets: real live-endpoint or test-run output instead.
2. **`kind="evidence"`** (PM/Lead framed live-screenshot): if project-context §7 names a framing script, wrap the raw capture with it (ticket id, shipped route, raw input, output dir under the artifact dir); then `upload_proof_of_done(ticket_id, filename, base64=<framed png>, kind="evidence", mime_type="image/png", description="…")`.
3. **`kind="fixed"`** (QA verification card): render/attach the QA test-report card and `upload_proof_of_done(ticket_id, filename, base64, kind="fixed", …)`.
   - Respect the status/actor gates and upload cap from project-context §7 (typically `status ∈ {ready_for_publish, done}` + an admin-tier actor). On 400/401/403/409 → report which gate fired; do not bypass. If the MCP `upload_proof_of_done` schema lags the backend and §7 names a direct upload endpoint, POST multipart there.
   - _Carveout:_ if the only surface lives behind the git host's login (CI config, pipeline status), note "PoD skipped — git-host-only surface" and move on.

## Step 7 — append_merge_info + flip PoD DoD item + final time + done

1. `append_merge_info(ticket_id, mr_url=<url>, mr_number=<N>, merge_sha=<SHA>, source_branch=<branch>, target_branch="<integration-branch>", title="<ticket-id>: …", merged_by=<agent identity from project-context §7>)` — real MR/PR URL + merge SHA.
2. `update_ticket(ticket_id, dod_checklist=[… PoD item done:true …])` — flip the PoD checklist item true only now.
3. `log_ticket_time(ticket_id, minutes=<bookkeeping>, note="publish bookkeeping")` — only if there is any.
4. `update_ticket_status(ticket_id, status="done", reason="MR !<N> merged @ <SHA>; PoD captured")`.
5. `add_ticket_comment(ticket_id, body=<closure summary: MR id, merge SHA, PoD ids per kind, DoD line, time logged>)`.

## Step 8 — Parent-gate check

If this ticket has a `parent_task_id`: `list_tickets(sprint_id=<sprint>)`, confirm every sibling child is `done`/`cancelled`. All done → flip the parent `ready_for_publish → done` ("All N children done"). Children remaining → leave the parent parked and name the open children.

## §7 acknowledgement (always emit, exactly four lines)

```text
✅ <ticket-id> → done — MR !<N> merged @ <SHA>, <integration-branch> advanced
⏱ <bookkeeping minutes this turn> min (cumulative now <total>)
🔲 merged (pre-authorized | approved) · merge_info appended · PoD kind=fixed + kind=evidence · DoD PoD-item=true
🚫 <blocks remaining — e.g. "parent <P> parked: children X,Y open" or "none">
```

Never report done while 🚫 is non-empty or the integration branch has not advanced. No tags without an explicit request.
