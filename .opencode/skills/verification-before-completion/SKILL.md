---
name: verification-before-completion
description: The done-gate. Use BEFORE claiming any task, fix, or feature is complete — every time, no exceptions. Triggers: about to say "done", "готово", "works now", writing a completion summary, or feeling relief that it "should work".
---

# Verification Before Completion

## The Iron Law
**NO "DONE" WITHOUT EVIDENCE FROM THIS REPO'S CHECKS, RUN IN THIS SESSION.**

## The gate
1. Run this repo's verification suite (AGENTS.md → "Mandatory Workflows" → verification commands). All of it, not a sample. Respect the repo's rules on who runs project-wide checks (in orchestrated sessions that may be the orchestrator's dedicated verification task — then your completion report says exactly which checks remain and for whom).
2. Read the FULL output. Warnings and errors you did not cause are reported by name anyway.
3. Re-read the ORIGINAL request. Every bullet answered? Anything silently skipped → name it.
4. Compare against spec/plan artifacts if any (spec acceptance criteria, tasks.md checkboxes, plan tasks).
5. Only then report completion — with the evidence: commands run + results.

## Claims vs evidence

| Claim | Required evidence |
|---|---|
| "Tests pass" | The suite run + pass count in this session |
| "Lint clean" | The lint run output |
| "Feature works" | The check from tdd Mode A/B: failed before, passes now |
| "All requirements covered" | Requirement-by-requirement trace against spec/plan |

## Rationalizations

| Excuse | Reality |
|---|---|
| "It should work now" | "Should" is not evidence. Run it. |
| "CI will catch it" | CI catches it after you claimed done — that is a falsified report. |
| "Only one file changed" | The suite is cheap relative to a wrong "done". |

## Red flags
Summarizing success without a command run in this session · "mostly done" / "except for" without a task list · skipping the full suite because part was already green.

## Checklist
- [ ] Full verification suite run in this session, output read
- [ ] Failures/warnings reported, none hidden
- [ ] Original request re-read; every item addressed or explicitly deferred
- [ ] Spec/plan checkboxes and acceptance criteria reconciled
- [ ] Completion report includes the evidence
