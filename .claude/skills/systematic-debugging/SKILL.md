---
name: systematic-debugging
description: Root-cause debugging discipline. Use when encountering ANY bug, test failure, or unexpected behavior — before proposing any fix. Triggers: a bug report, a red test, "doesn't work", "не работает", "падает", stack traces, intermittent failures.
---

# Systematic Debugging

## The Iron Law
**NO FIXES WITHOUT ROOT-CAUSE INVESTIGATION FIRST.**

## Four phases — each completes before the next

### 1. Root-cause investigation
- Read the error message FULLY. Reproduce consistently (find the minimal repro).
- Check recent changes (`git diff`, `git log`).
- Multi-component system? Instrument the boundaries: log what enters/exits each one; find WHERE it breaks.
- Trace the data flow backward to the origin. Fix at the source, not the symptom.

### 2. Pattern analysis
- Find a working example of the same mechanism in this codebase. Read it completely.
- List every difference between working and broken.

### 3. Hypothesis — one at a time
- State it specifically: "X is the root cause because Y."
- Smallest possible change to test it. One variable at a time. Observe.

### 4. Implementation
- Failing check first (`tdd`), then ONE fix. No "while I'm here".
- Verify the fix AND that the failure mode cannot silently return.
- **3+ fixes failed → STOP. Question the architecture, not the hypotheses** — each fix revealing new coupling elsewhere means the design is wrong.

## Rationalizations

| Excuse | Reality |
|---|---|
| "Quick fix first, investigate later" | The quick fix hides the root cause and adds a second bug. |
| "Retry probably fixes it" | Intermittent ≠ random. Find the race, timeout or stale state. |
| "Just catch the exception" | A swallowed error is tomorrow's crash, harder to trace. |

## Red flags
Editing code before reproducing · changing multiple things between runs · catching/suppressing instead of fixing · a third fix attempt without stopping.

## Checklist
- [ ] Root cause identified and stated in one sentence
- [ ] Working-vs-broken differences listed
- [ ] One hypothesis tested at a time
- [ ] Fix preceded by a failing check, single-purpose
- [ ] Verified fixed; nothing suppressed
