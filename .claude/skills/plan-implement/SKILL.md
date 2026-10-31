---
name: plan-implement
description: Plan-then-execute discipline for non-trivial tasks with clear requirements. Use when a change spans multiple files or steps but does not need a full spec (spec-level features go through the /speckit.* commands instead). Also use when the user says "plan first", "составь план", "работай по плану".
---

# Plan → Implement

## Overview
A plan is written for an engineer who has not seen this conversation. Plan first, then execute task by task, verifying each one.

## Iron Laws
1. **NO MULTI-STEP IMPLEMENTATION WITHOUT A WRITTEN PLAN.**
2. **NO TASK IS DONE WITHOUT ITS VERIFICATION STEP PASSING.**

Note for orchestrated OpenCode sessions: the plan DOCUMENT format is owned by the `plan-protocol` skill / `plan_save`. This skill owns the DISCIPLINE — task sizing, verification per task, execution loop. When both apply: plan-protocol for the file, plan-implement for behavior.

## Phase 1 — Write the plan

Header: **Goal** (one sentence), **Approach** (2–3 sentences), **Spec** (link if it comes from `/speckit.*`), **Global constraints** (exact values, one line each).

Location: quick tasks → chat/todo list; multi-session work → a committed file or the orchestrator plan store.

### Task format (bite-sized, 2–5 minutes each)

```
### Task N: <name>
Files: Create/Modify — exact paths
Steps:
- [ ] 1. Write the failing check (test or verification command)
- [ ] 2. Run it → expect FAIL (quote the expected failure)
- [ ] 3. Implement the exact change
- [ ] 4. Run again → expect PASS
- [ ] 5. Commit "<conventional message>"
```

- Each step is ONE action with a checkable result.
- Record interfaces: what the task consumes/produces that later tasks rely on (exact names/signatures).
- Self-review before starting: every requirement covered; every step unambiguous; the plan is not longer than the code it describes.

## Phase 2 — Execute

- Work tasks in order; tick checkboxes as you complete them.
- **Ledger over memory:** for long runs keep a progress note (plan store or file) so state survives context loss; after compaction trust the ledger and `git log`, not recollection.
- **Rulings, not stalls:** plan wrong or a fact missing? Record `Ruling: <conflict> — <decision> — <reason>`, adjust the plan, continue. Never silently improvise; never block on trivia.
- Commit after every verified task.

## STOP and ask the user when
- The next step is irreversible or destructive (data loss, force-push, production deploy)
- Security-sensitive actions are required (credentials, secrets)
- The plan is so broken every path is a guess → back to planning or `/speckit.specify`

## Rationalizations

| Excuse | Reality |
|---|---|
| "I'll keep the plan in my head" | Context will be compacted; the plan will not survive. |
| "Task 3 turned out bigger than planned" | Split it, record a Ruling, keep going. |
| "Verification is obvious, skip writing it" | An unverified step is a wish, not a task. |

## Checklist
- [ ] Written plan: bite-sized tasks, exact files, verification per task
- [ ] Every task executed check-first (tdd)
- [ ] Checkboxes/ledger up to date; deviations recorded as Rulings
- [ ] All tasks verified and committed
