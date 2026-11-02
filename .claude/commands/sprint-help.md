---
description: Show the sprint workflow reference (states, transitions, logging rules)
---

Display the full sprint workflow reference to the user. Project-specific values (ticket ID format, agent identity, PoD rules, integration branch, merge policy) come from project-context §7/§8 — mention that, and fill them in if project-context is loaded.

## Sprint Workflow Reference

### State Flow

```
planned → in_progress → ready_for_qa → qa_progress → ready_for_publish → done
                                          │
                                     qa_failed → in_progress (retry)
```

### Time Logging Rules

| Transition                      | Log                                  |
| ------------------------------- | ------------------------------------ |
| planned → in_progress           | Nothing                              |
| in_progress → ready_for_qa      | Implementation + rework + validation |
| ready_for_qa → qa_progress      | Nothing                              |
| qa_progress → ready_for_publish | QA time                              |
| qa_progress → qa_failed         | QA + failure investigation           |
| qa_failed → in_progress         | Nothing                              |
| ready_for_publish → done        | Bookkeeping (if any)                 |

**Core principle:** Log time when a phase **ends**, not when it begins.

### Available Commands

- `/sprint-all` — discover all tickets and run each to done
- `/sprint-batch <ids>` — run a specific list of tickets to done
- `/sprint-run <ticket>` — run one ticket from current state to done
- `/sprint-move <ticket> <from>-><to>` — validate a single transition
- `/sprint-log <ticket> <transition> <time>` — log time for a transition
- `/sprint-fix <ticket> <description>` — document a fix as a ticket comment (required after qa_failed)
- `/sprint-publish <ticket>` — push code, open the MR/PR to the integration branch (project-context §8), and merge (used at `ready_for_publish → done`)
- `/sprint-dor <ticket>` — check Definition of Ready
- `/sprint-dod <ticket>` — check Definition of Done
- `/sprint-help` — show this reference
