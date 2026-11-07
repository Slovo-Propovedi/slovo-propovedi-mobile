# Workflow mandate (SDD, plan-implement, TDD)

Before ANY non-trivial task, pick the workflow and load its skill via the `skill` tool:

- New feature / API contract / cross-cutting / vague requirements → spec-kit commands: `/speckit.specify` → `/speckit.clarify` → `/speckit.plan` → `/speckit.tasks` → `/speckit.implement`
- Clear multi-step change → `plan-implement`
- Bug / red test / unexpected behavior → `systematic-debugging`
- Any code change → `tdd` (verification-first when the repo has no test runner)
- Always → `ponytail` (smallest complete change) and `verification-before-completion` before claiming done

No production code without a failing check first. Details: AGENTS.md → "Mandatory Workflows: SDD, Plan-Implement, TDD".
