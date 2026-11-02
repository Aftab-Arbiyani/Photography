---
name: requirements-doc
description: Write and structure software requirements (PRD/BRD), user stories, and business rules. Use whenever capturing requirements, defining acceptance criteria, documenting business rules or process flows, or turning a business goal into functional requirements — even if "requirements" is not said explicitly.
---

# Requirements documentation

_An ambiguity you paper over becomes a rebuild. Write it down as an open question instead of guessing, and keep requirements to the "what" — the moment you specify the "how", you've quietly made an engineering decision inside a business doc._

## Workflow

1. Confirm the business objective and a measurable success signal.
2. Identify stakeholders, users, and the decision the doc informs.
3. Draft requirements; flag every ambiguity as an open question instead of guessing.
4. Keep requirements solution-free — the "what", not the "how".

## Requirement quality checklist

- Specific, testable, unambiguous.
- Traceable to a business objective (cut gold-plating).
- Covers edge cases, validation rules, and error behavior.
- Acceptance criteria concrete enough to write tests from (with the project's test runners, project-context §2).

## Document template

Output: write to the project's docs dir (project-context §3; default `docs/`).

```md
# <Feature> — Requirements

## Objective

<problem, who has it, desired outcome, success metric>

## Stakeholders & users

<who is affected and what they need>

## Functional requirements

- FR-1: As a <user>, I can <action> so that <value>.
  - AC: Given <state>, when <action>, then <result>.
- FR-2: ...

## Business rules

- BR-1: <rule and the edge cases it governs>

## Process flow

Current: <steps> -> Proposed: <steps; highlight deltas>

## Out of scope

- <explicitly excluded>

## Assumptions & open questions

- assumption: <...>
- question: <for stakeholders>
```

## User-story format

"As a <role>, I want <capability>, so that <benefit>", with Given/When/Then acceptance criteria. One story = one demoable slice — sized to become a single ticket on the project's tracker (project-context §7).
