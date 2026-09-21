/**
 * profile — in-session model-profile switcher.
 *
 * The ONLY profile-switching mechanism for this project's OpenCode setup.
 * Replaces the removed launch-script mechanism (use-profile.sh + OPENCODE_CONFIG
 * + --standalone): plain `opencode` just works, and the last chosen profile is
 * persisted in ctx.storage (plugin storage) so it survives restarts.
 *
 * Semantics:
 * - Only agents with mode "subagent" (researcher/coder/explore/scribe/reviewer
 *   in this project) get their model written into the agent registry via
 *   ctx.agent.transform — they apply to subagents spawned AFTER the switch
 *   (registry-level, per-agent). "primary"-mode agents (plan/build) are
 *   deliberately SKIPPED here: opencode always prefers an agent's own
 *   registry-configured model over the session's live model, so pinning a
 *   primary agent would permanently defeat ctx.session.switchModel for it —
 *   every future /profile switch would silently stop changing that agent's
 *   model for the current session.
 * - The primary (orchestrator) model is applied to the CURRENT session via
 *   ctx.session.switchModel — this is per-session, exactly like the TUI model
 *   switcher, and is the ONLY mechanism that changes plan/build's model. It
 *   takes effect immediately; registry-pinned subagent models apply at the
 *   next subagent spawn, not retroactively.
 * - No service restart is ever needed: the plugin reads the persisted profile
 *   at startup and /profile <name> re-applies the registry immediately.
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

export default Plugin.define({
  id: "profile",
  async setup(ctx) {
    const profilesDir = path.join(ctx.location.directory, ".opencode", "profiles")
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
      } catch (error) {
        warn(`stored profile "${storedProfile}" could not be loaded: ${toMessage(error)} — starting with defaults`)
        if (isMissingFileError(error)) {
          await ctx.storage.remove(STORAGE_KEY)
        }
      }
    }

    await ctx.agent.transform((editor) => {
      if (!activeProfile) return

      for (const [agentId, modelRef] of Object.entries(activeProfile.agents)) {
        const agent = editor.get(agentId)
        if (!agent) {
          warn(`profile "${activeProfileName}" references unknown agent "${agentId}" — skipped`)
          continue
        }
        // An agent with its own registry-configured model always wins over the
        // session's live model (opencode resolves per-agent model before any
        // session default). Pinning a "primary" agent here would permanently
        // defeat ctx.session.switchModel below for it — plan/build must stay
        // unpinned so switchModel remains the sole, immediate switch mechanism
        // for the current session. Only true subagents get pinned: their model
        // is resolved once, at spawn time, from the registry, with no session
        // of their own for switchModel to target.
        if (agent.mode !== "subagent") continue
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

    const buildSummaryMessage = (name: string): string => {
      const profile = activeProfile
      if (!profile) {
        return `✅ Profile "${name}" activated. Primary and subagent models are set.`
      }
      const subagentSummary = PROFILE_AGENTS.map((agentId) => {
        const modelRef = profile.agents[agentId]
        return `    ${agentId}: ${modelRef ? formatRef(modelRef) : "(unset — skipped)"}`
      }).join("\n")
      return [
        `✅ Profile switched to "${name}".`,
        `  primary: ${formatRef(profile.primary)} (applied to this session now)`,
        "  subagents (apply at next spawn):",
        subagentSummary,
      ].join("\n")
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
      await ctx.agent.reload()
      await ctx.session.switchModel({ sessionID, model: profile.primary })
      await ctx.session.synthetic({ sessionID, text: buildSummaryMessage(name) })
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