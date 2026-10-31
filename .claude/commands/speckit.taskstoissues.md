---
description: Convert existing tasks into actionable, dependency-ordered Forgejo issues for the feature based on available design artifacts.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Pre-Execution Checks

**Check for extension hooks (before tasks-to-issues conversion)**:
- Check if `.specify/extensions.yml` exists in the project root.
- If it exists, read it and look for entries under the `hooks.before_taskstoissues` key
- If the YAML cannot be parsed or is invalid, do not skip silently: tell the user that `.specify/extensions.yml` could not be read (include the parser error) and that no hooks were checked, including any mandatory (`optional: false`) hooks registered there, then continue normally
- Filter out hooks where `enabled` is explicitly `false`. Treat hooks without an `enabled` field as enabled by default.
- For each remaining hook, do **not** attempt to interpret or evaluate hook `condition` expressions:
  - If the hook has no `condition` field, or it is null/empty, treat the hook as executable
  - If the hook defines a non-empty `condition`, skip the hook and leave condition evaluation to the HookExecutor implementation
- For each executable hook, output the following based on its `optional` flag:
  - **Optional hook** (`optional: true`):
    ```
    ## Extension Hooks

    **Optional Pre-Hook**: {extension}
    Command: `/{command}`
    Description: {description}

    Prompt: {prompt}
    To execute: `/{command}`
    ```
  - **Mandatory hook** (`optional: false`):
    ```
    ## Extension Hooks

    **Automatic Pre-Hook**: {extension}
    Executing: `/{command}`
    EXECUTE_COMMAND: {command}

    Wait for the result of the hook command before proceeding to the Outline.
    ```
    After emitting the block above you MUST actually invoke the hook and wait for it to finish before continuing. Run it the same way you would run the command yourself in this agent/session (the invocation may differ from the literal `{command}` id shown above, e.g. a skills-mode agent runs it as `/skill:speckit-...` or `$speckit-...`). Emitting the block alone does not run the hook.
- If no hooks are registered or `.specify/extensions.yml` does not exist, skip silently

## Outline

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").
1. **IF EXISTS**: Load `.specify/memory/constitution.md` for project principles and governance constraints.
1. From the executed script, extract the path to **tasks**.
1. Get the Git remote and derive the Forgejo coordinates from it:

```bash
git config --get remote.origin.url
```

Parse the URL into `INSTANCE`, `OWNER`, `REPO`: strip a trailing `.git`; support both `https://host/owner/repo.git` and `git@host:owner/repo.git`.

> [!CAUTION]
> ONLY CREATE ISSUES IN THE `OWNER/REPO` ON THE `INSTANCE` DERIVED FROM THE REMOTE URL

1. **Token check**: the Forgejo API token must be available in the `FORGEJO_TOKEN` environment variable (Forgejo → Settings → Applications → access token with issue write scope). If `FORGEJO_TOKEN` is unset or empty, STOP and tell the user to export it. Every API call below sends the header `Authorization: token $FORGEJO_TOKEN`.

1. **Fetch existing issues for deduplication**: Before creating anything, build the set of task IDs you are about to process from `tasks.md` (each is a `T` followed by **at least** three digits, e.g. `T001` — `/speckit.converge` assigns new IDs with `T{M+1:03d}`, which is a floor rather than a cap, so once a file has more than 999 tasks the IDs are four digits or longer). Then list existing issues:

```bash
curl -sf -H "Authorization: token $FORGEJO_TOKEN" \
  "$INSTANCE/api/v1/repos/$OWNER/$REPO/issues?state=all&type=issues&limit=50&page=N"
```

Start at `page=1` and increment until you get an empty array or every task ID has been matched (do not fetch the whole history once all IDs are accounted for). For each issue title, match the pattern `\bT\d{3,}\b` (the `{3,}` accepts four-digit and longer IDs — with `\d{3}` a title containing `T1000` would not match at all; word boundaries stop a token like `ST001` from matching and force the whole digit run to be consumed, so `T100` can never match inside `T1000`; this also recognises titles written as `T001 ...`, `T001: ...` or `[T001] ...`) and, when it matches one of your task IDs, mark that ID as already having an issue.

1. For each task in the list, create a Forgejo issue via the API. Task lines in `tasks.md` start with a markdown checkbox, so first strip the leading `- [ ]` (and any `[P]` / `[US#]` markers) to recover the task ID and its description. Create the issue with a single canonical title of the form `T001: <description>` (for example, the line `- [ ] T001 Create project structure` becomes the title `T001: Create project structure`):

```bash
curl -sf -X POST -H "Authorization: token $FORGEJO_TOKEN" -H "Content-Type: application/json" \
  -d '{"title": "T001: <description>", "body": "<original tasks.md line and source reference>"}' \
  "$INSTANCE/api/v1/repos/$OWNER/$REPO/issues"
```

   - **Skip** any task whose ID is already present in the set of existing issues from the previous step, and report it (for example, `T001 already has an issue, skipping`).
   - Only create issues for tasks that do not yet have a matching issue.

> [!CAUTION]
> UNDER NO CIRCUMSTANCES EVER CREATE ISSUES IN REPOSITORIES THAT DO NOT MATCH THE REMOTE URL

## Post-Execution Checks

**Check for extension hooks (after tasks-to-issues conversion)**:
Check if `.specify/extensions.yml` exists in the project root.
- If it exists, read it and look for entries under the `hooks.after_taskstoissues` key
- If the YAML cannot be parsed or is invalid, do not skip silently: tell the user that `.specify/extensions.yml` could not be read (include the parser error) and that no hooks were checked, including any mandatory (`optional: false`) hooks registered there, then continue normally
- Filter out hooks where `enabled` is explicitly `false`. Treat hooks without an `enabled` field as enabled by default.
- For each remaining hook, do **not** attempt to interpret or evaluate hook `condition` expressions:
  - If the hook has no `condition` field, or it is null/empty, treat the hook as executable
  - If the hook defines a non-empty `condition`, skip the hook and leave condition evaluation to the HookExecutor implementation
- For each executable hook, output the following based on its `optional` flag:
  - **Optional hook** (`optional: true`):
    ```
    ## Extension Hooks

    **Optional Hook**: {extension}
    Command: `/{command}`
    Description: {description}

    Prompt: {prompt}
    To execute: `/{command}`
    ```
  - **Mandatory hook** (`optional: false`):
    ```
    ## Extension Hooks

    **Automatic Hook**: {extension}
    Executing: `/{command}`
    EXECUTE_COMMAND: {command}
    ```
    After emitting the block above you MUST actually invoke the hook and wait for it to finish before continuing. Run it the same way you would run the command yourself in this agent/session (the invocation may differ from the literal `{command}` id shown above, e.g. a skills-mode agent runs it as `/skill:speckit-...` or `$speckit-...`). Emitting the block alone does not run the hook.
- If no hooks are registered or `.specify/extensions.yml` does not exist, skip silently
