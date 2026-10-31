---
name: tdd
description: Test-driven development discipline. Use before writing ANY production code — features, bugfixes, behavior changes. Use when the user says "TDD", "red-green-refactor", "test first", or asks why a change has no test. In repos without a test runner it degrades to the verification-first loop (validator/linter/syntax check as the failing check).
---

# Test-Driven Development (TDD)

## Overview
Define the check first. Watch it fail. Write the minimal code to pass. Watch it pass.

**Core principle:** a check you never saw fail proves nothing.

## The Iron Law
**NO PRODUCTION CODE WITHOUT A FAILING CHECK FIRST.**

Wrote implementation before the check? Delete it and start over. Do not keep it "as reference" — delete means delete.

## Pick the mode by repo, not by mood

| Repo has | Mode |
|---|---|
| A test runner (jest, vitest, pytest, go test...) | **Mode A — real tests** |
| Only validators / linters / syntax checks (no test framework) | **Mode B — verification-first** |

## Mode A — Red, Green, Refactor

1. **RED — write one failing test.** One behavior per test; the name states the behavior. Test the real unit; mock only true externals (network, clock, storage). Follow repo test conventions (co-located `*.test.tsx` / `*.spec.ts`, faker factories over hardcoded literals).
2. **Verify RED — run it, watch it fail. MANDATORY, never skip.** It must FAIL, not crash — the failure message matches the missing behavior. Passed immediately? You are testing existing behavior; fix the test.
3. **GREEN — minimal code to pass.** Simplest code that passes; no extra features, no "improvements" beyond the test.
4. **Verify GREEN — run the relevant suite. MANDATORY.** Whole suite or affected area, not just your file. ANY failure in the output — including one you did not cause — is reported by name. A red test you scrolled past is a falsified report.
5. **REFACTOR — cleanup with tests green.** Deduplicate, rename, extract; no behavior change; re-run after.

## Mode B — verification-first (no test runner)

1. State the observable outcome in one sentence ("`npm run validate` passes", "`just lint` clean", "the spec diff contains field Y").
2. Pick or extend the repo check command that proves it; if no check exists, write it FIRST — the check is the deliverable.
3. Run the check BEFORE the change: it must fail / report the gap.
4. Make the minimal change.
5. Re-run: must pass. Commit.

## Rationalizations

| Excuse | Reality |
|---|---|
| "Too simple to test" | Simple code breaks; the check costs one minute. |
| "I'll add tests after" | Tests written after the code pass immediately and prove nothing. |
| "Keep the code as reference" | You will adapt it — that is testing after. Delete means delete. |
| "TDD slows me down" | The debugging it prevents costs more. |
| "Just a small tweak" | Tweaks are what regressions are made of. |

## Red flags — stop and restart
Code exists before the check · check passed on the first run · "just this once" · skipped Verify RED or Verify GREEN because "it's obvious".

## Checklist
- [ ] Every behavior change has a failing-check-first story
- [ ] Watched each check fail for the expected reason
- [ ] Minimal implementation to pass
- [ ] Full relevant suite green, output clean
- [ ] Refactor (if any) kept everything green

**Final rule:** production code → a check existed and failed first. Otherwise it was not TDD.
