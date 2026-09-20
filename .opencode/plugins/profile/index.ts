/**
 * profile — in-session model-profile switcher.
 *
 * The ONLY profile-switching mechanism for this project's OpenCode setup.
 * Replaces the removed launch-script mechanism (use-profile.sh + OPENCODE_CONFIG
 * + --standalone): plain `opencode` just works, and the last chosen profile is
 * persisted in ctx.storage (plugin storage) so it survives restarts.
 *
 * Semantics:
 * - Subagent models (plan/build/researcher/coder/explore/scribe/reviewer) are
 *   written into the agent registry via ctx.agent.transform — they apply to
 *   subagents spawned AFTER the switch (registry-level, per-agent).
 * - The primary (orchestrator) model is applied to the CURRENT session via
 *   ctx.session.switchModel — this is per-session, exactly like the TUI model
 *   switcher. Agent models apply at the next subagent spawn, not retroactively.
 * - No service restart is ever needed: the plugin reads the persisted profile
 *   at startup and /profile <name> re-applies the registry immediately.
 *
 * Data source: .opencode/profiles/<name>.json — plain JSON files (no comments),
 * shape { "primary": "<provider/model>", "agents": { "<agent>": "<provider/model>" } }.
 * Strings may carry a variant suffix: "provider/model#variant".
 * Values are parsed once at the file boundary (see loadProfile) into ModelRef;
 * nothing downstream re-parses or re-validates, so the apply path is
 * infallible by construction once a profile has loaded.
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
        if (!editor.get(agentId)) {
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

          let profile: ProfileData
          try {
            profile = await loadProfile(profilesDir, argument)
          } catch (error) {
            let valid: string
            try {
              valid = (await listProfiles(profilesDir)).join(", ")
            } catch {
              valid = "(unavailable — profile directory unreadable)"
            }
            await ctx.session.synthetic({
              sessionID,
              text: `❌ profile "${argument}" could not be loaded: ${toMessage(error)} — valid profiles: ${valid}`,
            })
            return
          }

          activeProfile = profile
          activeProfileName = argument
          await ctx.storage.set(STORAGE_KEY, argument)
          await ctx.agent.reload()
          await ctx.session.switchModel({ sessionID, model: profile.primary })
          await ctx.session.synthetic({ sessionID, text: buildSummaryMessage(argument) })
        },
      })
    })
  },
})