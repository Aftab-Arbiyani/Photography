---
name: research-synthesis
description: Plan user research and synthesize interviews, surveys, support tickets, or feedback into themes, personas, and prioritized findings. Use whenever analyzing qualitative user input, designing an interview guide or survey, building personas or journey maps, or extracting insights from feedback.
---

# User research & synthesis

_The finding that contradicts the team is the one worth the study. Guard against the tidy narrative — separate observation from interpretation, state your N honestly, and don't let a small sample harden into a confident claim._

## Synthesis workflow

1. State the research question and the decision it informs.
2. Tag each data point (quote/observation) with a code; group codes into themes.
3. Rank themes by frequency x impact; note contradicting or surprising signals.
4. Turn each theme into a "so what" recommendation with a confidence level.

## Rules

- Separate observation from interpretation.
- Report findings that contradict team assumptions.
- State sample size and limitations; do not over-generalize small N.

## Findings template

Output: write to the project's docs dir (project-context §3; default `docs/`).

```md
# <Study> — Findings

## Question & method

<question> | <method, N, who>

## Themes (ranked)

1. <Theme> — seen in N/M participants — impact: H/M/L
   - Evidence: "<quote>"; <observation>
   - Implication: <so what>
   - Recommendation: <action> (confidence: H/M/L)

## Personas (if applicable)

- <name>: goals / frustrations / context (grounded in data)

## Gaps / next research

- <what we still do not know>
```

## Handing findings to the team

Recommendations that become work should be handed to `business-analyst` (to turn into requirements) or the `project-manager` (to seed tickets on the tracker, project-context §7) — don't let a finding die in a doc.

## Interview guide

Warm-up → context → behavior questions (open, non-leading) → wrap-up. Ask about past behavior, not hypotheticals. Avoid yes/no and leading phrasing.
