# Workflow mandate (SDD, plan-implement, TDD)

Before ANY non-trivial task, pick the workflow and load its skill:

- New feature / API contract / cross-cutting / vague requirements → spec-kit
  workflow (spec, plan, tasks — see AGENTS.md → "Mandatory Workflows")
- Clear multi-step change → `plan-implement`
- Bug / red test / unexpected behavior → systematic debugging first
- Any code change → `tdd` (verification-first when the repo has no test runner)
- Always → minimal diff (`ponytail`) and `verification-before-completion`
  before claiming done

No production code without a failing check first. Details: AGENTS.md →
"Mandatory Workflows: SDD, Plan-Implement, TDD".

## Delegation routing (Crush session tools)

Crush has no named agents — roles are defined as skills in `.crush/skills/`
(`agent-orchestrator`, `agent-coder`, `agent-researcher`, `agent-reviewer`,
`agent-scribe`). Delegate with the native subagent tool `agent_dispatch`;
give the subagent its role by pointing the prompt at the role skill and
picking the right `access`:

| Sub-agent kind | Role skills | Launch with |
| --- | --- | --- |
| Read-only (inspect + run checks, no edits) | `agent-researcher`, `agent-reviewer` | `agent_dispatch` with `access: read` |
| Write-capable (edit files, run builds) | `agent-coder`, `agent-scribe` | `agent_dispatch` with `access: write` |

Rules:

- The prompt is all the subagent sees — it does NOT see this conversation.
  Include the task, the exact files, the verification commands, and the
  instruction to first read `.crush/skills/agent-<role>/SKILL.md`.
- The orchestrator owns analysis and planning; the coding subagent owns
  mechanical implementation only (AGENTS.md → "Agent Division of Labor").
- Give parallel write subagents scopes that do not overlap.
- Subagents keep running if the turn is interrupted; their report arrives as
  a `<subagent-report>` message that wakes the orchestrator. Do not poll —
  end the turn once everything left depends on their reports.
- Follow-ups to a finished subagent go through `agent_send`; a stuck or
  off-task one through `agent_stop`.

### Session call discipline

- Make the tool call the FIRST act of a turn; put explanations after the call.
- One tool call per turn is safest for large payloads (plans, big prompts).
- Launch long-running subagents in the background and rely on their reports;
  never poll lists or sleep while waiting.
- When a call silently produces nothing (turn died), first re-run a tiny
  ping, then re-issue the real call in a fresh turn instead of assuming the
  model/harness died.
- Agents committing code MUST use `git commit -s` (DCO) — never bypass hooks
  with `--no-verify` without adding the sign-off manually.
