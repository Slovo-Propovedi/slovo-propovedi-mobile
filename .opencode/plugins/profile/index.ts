/**
 * profile — in-session model-profile switcher.
 *
 * The ONLY profile-switching mechanism for this project's OpenCode setup.
 * Replaces the removed launch-script mechanism (use-profile.sh + OPENCODE_CONFIG
 * + --standalone): plain `opencode` just works, and the last chosen profile is
 * persisted in ctx.storage (plugin storage) so it survives restarts.
 *
 * Semantics:
 * - Subagents that have their own .opencode/agents/<id>.md file (researcher/
 *   coder/scribe/reviewer in this project — see MARKDOWN_SUBAGENT_IDS) are
 *   pinned by rewriting the `model:` key directly in that file's frontmatter.
 *   This is load-bearing, not stylistic: opencode's markdown-agent loader
 *   re-applies each agent's frontmatter AFTER plugin transforms run, so a
 *   ctx.agent.transform pin on one of these gets silently discarded the
 *   instant it's set — confirmed empirically (a canary written into the
 *   transform survived on a built-in agent but was erased on every
 *   markdown-defined one). Writing the file makes our pin the same
 *   authoritative source the loader itself reads, so it survives.
 * - Built-in subagents with no project .md override (explore — see
 *   REGISTRY_SUBAGENT_IDS) have no frontmatter file to rewrite, so they're
 *   still pinned the old way, via ctx.agent.transform. This does work for
 *   them (nothing re-applies frontmatter over a built-in), and hand-writing
 *   a fresh explore.md to move it onto the same mechanism as the others
 *   would mean reconstructing its full accumulated permission set from
 *   scratch — explore is deliberately read-only, and a slightly-wrong
 *   reconstruction could silently loosen that. Not worth the risk for an
 *   agent that already pins correctly.
 * - "primary"-mode agents (plan/build) are deliberately left alone by both
 *   mechanisms: opencode always prefers an agent's own configured model over
 *   the session's live model, so pinning a primary agent would permanently
 *   defeat ctx.session.switchModel for it — every future /profile switch
 *   would silently stop changing that agent's model for the current session.
 * - The primary (orchestrator) model is applied to the CURRENT session via
 *   ctx.session.switchModel — this is per-session, exactly like the TUI model
 *   switcher, and is the ONLY mechanism that changes plan/build's model. It
 *   takes effect immediately; the registry pin (explore) applies at the next
 *   subagent spawn; the frontmatter pins (coder/scribe/researcher/reviewer)
 *   apply as soon as the file write + ctx.agent.reload() below complete.
 * - No service restart is ever needed: the plugin reads the persisted profile
 *   at startup and /profile <name> re-applies both mechanisms immediately.
 *
 * Data source: .opencode/profiles/<name>.json — plain JSON files (no comments),
 * shape { "primary": "<provider/model>", "agents": { "<agent>": "<provider/model>" } }.
 * Strings may carry a variant suffix: "provider/model#variant".
 * Values are parsed once at the file boundary (see loadProfile) into ModelRef;
 * nothing downstream re-parses or re-validates, so the apply path is
 * infallible by construction once a profile has loaded.
 *
 * No TUI dialog: a custom TUI-side plugin (context.ui.dialog.select, /models
 * style) was attempted here and abandoned — context.ui.router.current() never
 * reports `{type: "session"}` while actively chatting, on either opencode
 * 2.0.8 or 2.0.11, and context.ui.tabs as a fallback didn't resolve it either.
 * Without a reliable way for a TUI plugin to read "which session is this
 * prompt in", the dialog can't target the right session. This command's plain
 * list/switch (no picker) is the whole mechanism.
 */

import * as fs from "node:fs/promises"
import * as path from "node:path"
import { Model, Plugin } from "@opencode/plugin"

/** Plugin-scoped storage key holding the active profile name. */
const STORAGE_KEY = "activeProfile"

/** The 7 agent slots wired from a profile file, in display order. */
const PROFILE_AGENTS = ["plan", "build", "researcher", "coder", "explore", "scribe", "reviewer"] as const

/**
 * Subagents defined by a project .opencode/agents/<id>.md file — pinned by
 * rewriting that file's frontmatter (see writeAgentModelFrontmatter). Every
 * PROFILE_AGENTS entry except plan/build (primary, unpinned by design) and
 * explore (built-in, see REGISTRY_SUBAGENT_IDS).
 */
const MARKDOWN_SUBAGENT_IDS = new Set<string>(["researcher", "coder", "scribe", "reviewer"])

/**
 * Built-in subagents with no project .md file — pinned via the legacy
 * ctx.agent.transform registry mutation instead, since there's no
 * frontmatter to rewrite and reconstructing one from scratch risks losing
 * accumulated permissions (see the file header for why this is fine here).
 * Membership is hardcoded rather than read from editor.get(agentId).mode at
 * transform time: an earlier version tried that live read and it raced
 * against whichever transform merges an agent's own frontmatter into the
 * registry — when this transform ran first it saw the registry's built-in
 * default (mode: "primary" — see @opencode/schema's Agent.Info.default)
 * instead of "subagent", silently skipping the pin. A static set has no
 * ordering to race.
 */
const REGISTRY_SUBAGENT_IDS = new Set<string>(["explore"])

/** A parsed "provider/model[#variant]" reference — the canonical Model.Ref, trusted after the boundary. */
type ModelRef = Model.Ref

interface ProfileData {
  primary: ModelRef
  agents: Record<string, ModelRef>
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Render a ModelRef back to its "provider/model[#variant]" string form. */
function formatRef(ref: ModelRef): string {
  return ref.variant ? `${ref.providerID}/${ref.id}#${ref.variant}` : `${ref.providerID}/${ref.id}`
}

/** Human-readable rendering of an arbitrary value for error messages. */
function formatValue(value: unknown): string {
  if (typeof value === "string") return `"${value}"`
  if (value === null) return "null"
  if (typeof value === "object") return JSON.stringify(value) ?? String(value)
  return String(value)
}

/**
 * Parse "provider/model#variant" into the canonical Model.Ref (Law 4: Fail Fast).
 * Throws for malformed values; callers add profile/field context.
 */
function parseModelRef(raw: string): ModelRef {
  return Model.Ref.parse(raw)
}

/** Wrap parseModelRef so malformed values carry the profile/field location. */
function parseProfileRef(name: string, fieldPath: string, raw: string): ModelRef {
  try {
    return parseModelRef(raw)
  } catch {
    throw new Error(`profile "${name}" [${fieldPath}]: expected "provider/model[#variant]", got "${raw}"`)
  }
}

/**
 * Load and parse a profile file at the boundary. Validates the shape of every
 * field and parses every model string eagerly, so callers receive a fully
 * trusted ProfileData. Throws a descriptive error naming the offending field.
 */
async function loadProfile(profilesDir: string, name: string): Promise<ProfileData> {
  const filePath = path.join(profilesDir, `${name}.json`)
  const source = await fs.readFile(filePath, "utf8")
  const parsed = JSON.parse(source) as { primary?: unknown; agents?: unknown }

  if (typeof parsed.primary !== "string") {
    throw new Error(`profile "${name}" [primary]: expected "provider/model[#variant]", got ${formatValue(parsed.primary)}`)
  }

  if (typeof parsed.agents !== "object" || !parsed.agents) {
    throw new Error(`profile "${name}" [agents]: expected an object of agent models, got ${formatValue(parsed.agents)}`)
  }

  const agents: Record<string, ModelRef> = {}
  for (const [agentId, raw] of Object.entries(parsed.agents)) {
    if (typeof raw !== "string") {
      throw new Error(
        `profile "${name}" [/agents "${agentId}"]: expected "provider/model[#variant]", got ${formatValue(raw)}`
      )
    }
    agents[agentId] = parseProfileRef(name, `/agents "${agentId}"`, raw)
  }

  return { primary: parseProfileRef(name, "primary", parsed.primary), agents }
}

/** List profile names from the profiles directory (sorted, stable ordering). */
async function listProfiles(profilesDir: string): Promise<string[]> {
  const entries = await fs.readdir(profilesDir)
  return entries
    .filter((entry) => entry.endsWith(".json"))
    .map((entry) => entry.replace(/\.json$/, ""))
    .sort()
}

/** True when the error means "file does not exist on disk". */
function isMissingFileError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT"
}

/**
 * Write (or update) the top-level `model:` key in a subagent's own
 * .opencode/agents/<id>.md frontmatter, leaving everything else in the file
 * byte-for-byte untouched — description, permissions, and the whole prompt
 * body. The config schema accepts the same "provider/model[#variant]" string
 * used everywhere else here (@opencode/schema's ConfigAgent.Info.model
 * union), so formatRef's output can be written directly.
 *
 * Parses frontmatter by hand (not a YAML lib) since the shape here is known
 * and simple: a fixed set of top-level scalar keys plus one indented
 * `permissions:` list. A full YAML round-trip risks silently reformatting or
 * reordering that list; this only ever touches a single top-level line.
 *
 * Returns false (no write) when the file already has the desired line.
 */
async function writeAgentModelFrontmatter(agentsDir: string, agentId: string, modelRef: ModelRef): Promise<boolean> {
  const filePath = path.join(agentsDir, `${agentId}.md`)
  const source = await fs.readFile(filePath, "utf8")
  const match = source.match(/^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n)/)
  if (!match || match.index !== 0) {
    throw new Error(`agent file "${filePath}" has no frontmatter block starting at the top of the file`)
  }

  const [whole, open, body, close] = match
  const desiredLine = `model: ${formatRef(modelRef)}`
  const lines = body.split(/\r?\n/)
  const modelLineIndex = lines.findIndex((line) => /^model:\s/.test(line) || line === "model:")
  if (modelLineIndex !== -1) {
    if (lines[modelLineIndex] === desiredLine) return false
    lines[modelLineIndex] = desiredLine
  } else {
    const modeLineIndex = lines.findIndex((line) => /^mode:\s/.test(line))
    lines.splice(modeLineIndex !== -1 ? modeLineIndex + 1 : 0, 0, desiredLine)
  }

  const newSource = open + lines.join("\n") + close + source.slice(whole.length)
  if (newSource === source) return false
  await fs.writeFile(filePath, newSource, "utf8")
  return true
}

/**
 * Rewrite every MARKDOWN_SUBAGENT_IDS agent's frontmatter to match the given
 * profile, best-effort per agent (one missing/malformed file shouldn't block
 * the rest). Errors are collected and handed to the caller to report; this
 * never throws.
 */
async function applyMarkdownFrontmatterPins(agentsDir: string, profile: ProfileData): Promise<string[]> {
  const errors: string[] = []
  for (const agentId of MARKDOWN_SUBAGENT_IDS) {
    const modelRef = profile.agents[agentId]
    if (!modelRef) continue
    try {
      await writeAgentModelFrontmatter(agentsDir, agentId, modelRef)
    } catch (error) {
      errors.push(`${agentId}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  return errors
}

export default Plugin.define({
  id: "profile",
  async setup(ctx) {
    const profilesDir = path.join(ctx.location.directory, ".opencode", "profiles")
    const agentsDir = path.join(ctx.location.directory, ".opencode", "agents")
    const storedProfile = await ctx.storage.get(STORAGE_KEY)
    const warn = (message: string): void => {
      console.warn(`[profile] ${message}`)
    }

    // Reserved for the /profile command; the agent registry transform reads it.
    let activeProfile: ProfileData | null = null
    let activeProfileName: string | null = null

    if (typeof storedProfile === "string" && storedProfile) {
      try {
        activeProfile = await loadProfile(profilesDir, storedProfile)
        activeProfileName = storedProfile
        // Re-sync agent frontmatter with the persisted profile on every
        // startup, not just on an explicit /profile switch — the .md files
        // are the durable pin, so a plain server restart (no /profile call)
        // must still leave coder/scribe/etc. on the right model.
        const errors = await applyMarkdownFrontmatterPins(agentsDir, activeProfile)
        if (errors.length > 0) {
          warn(`profile "${storedProfile}": failed to sync agent frontmatter for ${errors.join(", ")}`)
        }
      } catch (error) {
        warn(`stored profile "${storedProfile}" could not be loaded: ${toMessage(error)} — starting with defaults`)
        if (isMissingFileError(error)) {
          await ctx.storage.remove(STORAGE_KEY)
        }
      }
    }

    // Only REGISTRY_SUBAGENT_IDS (built-ins with no .md file) go through
    // this path — see the file header for why markdown-defined subagents
    // are pinned via applyMarkdownFrontmatterPins instead: a registry pin on
    // one of those gets silently discarded once its own frontmatter gets
    // (re-)applied.
    await ctx.agent.transform((editor) => {
      if (!activeProfile) return

      for (const agentId of REGISTRY_SUBAGENT_IDS) {
        const modelRef = activeProfile.agents[agentId]
        if (!modelRef) continue
        const agent = editor.get(agentId)
        if (!agent) {
          warn(`profile "${activeProfileName}" references unknown agent "${agentId}" — skipped`)
          continue
        }
        editor.update(agentId, (agent) => {
          agent.model = modelRef
        })
      }
    })

    const buildListMessage = async (): Promise<string> => {
      let names: string[]
      try {
        names = await listProfiles(profilesDir)
      } catch (error) {
        return `❌ profile plugin: cannot read ${profilesDir}: ${toMessage(error)}`
      }

      const lines = names.map((name) => {
        const marker = name === activeProfileName ? " (active)" : ""
        return `  ${name}${marker}`
      })
      return [
        "Available profiles (model combos):",
        "",
        ...lines,
        "",
        "Usage:",
        "  /profile            list profiles + active one",
        "  /profile <name>     switch to that profile (persisted across restarts)",
      ].join("\n")
    }

    const buildSummaryMessage = (name: string, frontmatterErrors: readonly string[]): string => {
      const profile = activeProfile
      if (!profile) {
        return `✅ Profile "${name}" activated. Primary and subagent models are set.`
      }
      const subagentSummary = PROFILE_AGENTS.map((agentId) => {
        const modelRef = profile.agents[agentId]
        if (!modelRef) return `    ${agentId}: (unset — skipped)`
        const via = REGISTRY_SUBAGENT_IDS.has(agentId)
          ? "next spawn, registry"
          : MARKDOWN_SUBAGENT_IDS.has(agentId)
            ? "now, frontmatter"
            : "this session only, via switchModel"
        return `    ${agentId}: ${formatRef(modelRef)} (${via})`
      }).join("\n")
      const lines = [
        `✅ Profile switched to "${name}".`,
        `  primary: ${formatRef(profile.primary)} (applied to this session now)`,
        "  subagents:",
        subagentSummary,
      ]
      if (frontmatterErrors.length > 0) {
        lines.push("", `⚠ failed to update agent frontmatter for: ${frontmatterErrors.join(", ")}`)
      }
      return lines.join("\n")
    }

    /** Shared by "/profile <name>" and each per-profile "/profile-<name>" command. */
    const applyProfileToSession = async (sessionID: string, name: string): Promise<void> => {
      let profile: ProfileData
      try {
        profile = await loadProfile(profilesDir, name)
      } catch (error) {
        let valid: string
        try {
          valid = (await listProfiles(profilesDir)).join(", ")
        } catch {
          valid = "(unavailable — profile directory unreadable)"
        }
        await ctx.session.synthetic({
          sessionID,
          text: `❌ profile "${name}" could not be loaded: ${toMessage(error)} — valid profiles: ${valid}`,
        })
        return
      }

      activeProfile = profile
      activeProfileName = name
      await ctx.storage.set(STORAGE_KEY, name)
      const frontmatterErrors = await applyMarkdownFrontmatterPins(agentsDir, profile)
      await ctx.agent.reload()
      await ctx.session.switchModel({ sessionID, model: profile.primary })
      await ctx.session.synthetic({ sessionID, text: buildSummaryMessage(name, frontmatterErrors) })
    }

    // Snapshot at startup (not re-read per keystroke): command.transform's
    // callback must be synchronous, so the profile list/descriptions used for
    // the per-profile commands below are resolved once, here. A profile file
    // added after this plugin started won't get its own /profile-<name>
    // command until the next restart or hot-reload of this file — /profile
    // <name> (typed) still picks it up immediately since it reads disk fresh.
    const profileNames = await listProfiles(profilesDir).catch((error) => {
      warn(`cannot list profiles for command registration: ${toMessage(error)}`)
      return [] as string[]
    })
    const profileDescriptions = new Map<string, string>()
    for (const name of profileNames) {
      try {
        const profile = await loadProfile(profilesDir, name)
        profileDescriptions.set(name, `Switch to profile "${name}" (primary: ${formatRef(profile.primary)}).`)
      } catch (error) {
        profileDescriptions.set(name, `⚠ profile "${name}" is invalid: ${toMessage(error)}`)
      }
    }

    await ctx.command.transform((editor) => {
      editor.add({
        name: "profile",
        description:
          "Switch model profiles in-session. No args: list profiles. With a name: activate it (persisted across restarts).",
        async execute({ sessionID, prompt }) {
          const argument = prompt.text.trim().split(/\s+/)[0] ?? ""

          if (!argument) {
            await ctx.session.synthetic({ sessionID, text: await buildListMessage() })
            return
          }

          await applyProfileToSession(sessionID, argument)
        },
      })

      // One command per profile file, e.g. "profile-zai_and_free" — typing
      // "/profile" and pausing shows all of these (with descriptions) via
      // opencode's native by-name slash completion, giving a discoverable
      // list of profiles without remembering exact names. This is the only
      // "suggestions" mechanism the plugin API actually supports (see the
      // "No TUI dialog" note above) — no picker, no keymap involved.
      for (const name of profileNames) {
        editor.add({
          name: `profile-${name}`,
          description: profileDescriptions.get(name) ?? `Switch to profile "${name}".`,
          async execute({ sessionID }) {
            await applyProfileToSession(sessionID, name)
          },
        })
      }
    })
  },
})