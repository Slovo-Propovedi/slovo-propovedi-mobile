# Workflow mandate (SDD, plan-implement, TDD)

Before ANY non-trivial task, pick the workflow and load its skill via the `skill` tool:

- New feature / API contract / cross-cutting / vague requirements → spec-kit commands: `/speckit.specify` → `/speckit.clarify` → `/speckit.plan` → `/speckit.tasks` → `/speckit.implement`
- Clear multi-step change → `plan-implement`
- Bug / red test / unexpected behavior → `systematic-debugging`
- Any code change → `tdd` (verification-first when the repo has no test runner)
- Always → `ponytail` (smallest complete change) and `verification-before-completion` before claiming done

No production code without a failing check first. Details: AGENTS.md → "Mandatory Workflows: SDD, Plan-Implement, TDD".

## Delegation routing (opencode session tools)

| Sub-agent kind | Agents | Launch with |
| --- | --- | --- |
| Read-only (no edit/write/bash) | `explore`, `researcher`, `reviewer` | `delegate` (inside Code Mode: `tools.delegate`) |
| Write-capable (any edit/write/bash) | `coder`, `build`, `scribe` | native `task` tool only |

Calling `tools.delegate` for a write-capable agent fails hard: `Delegation failed: Agent "coder" is write-capable and requires the native task tool`. This session hit exactly that — routing `coder` through `delegate` returned the error instead of launching; the correct call is the native `task` tool (or another native subagent call) for `coder`.

When background work is needed, prefer `background: true` on the native `task` tool; never poll for completion — rely on task notifications.

### Session call discipline

- Make the tool call the FIRST act of a turn; put explanations after the call — long prose before a call risks the turn being cut mid-generation and nothing launching.
- One tool call per turn is safest for large payloads (plans, big prompts); split oversized payloads into smaller calls.
- Launch subagents via background:true and rely on task notifications; never poll lists.
- When a call silently produces nothing (turn died), first re-run a tiny `execute` ping, then re-issue the real call in a fresh turn instead of assuming the model/harness died.
