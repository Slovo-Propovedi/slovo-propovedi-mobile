/**
 * failover — adaptive model failover for the profile plugin.
 *
 * Mounted by plugins/profile/index.ts (installFailover). Watches the session
 * retry hook AND the raw http.response hook for QUOTA/rate-limit failures and
 * — when the failing model has a configured alternative (FAILOVER_PAIRS) —
 * switches EVERY agent that is running that model to the alternative, using
 * the same apply mechanisms the profile plugin already owns:
 *   - markdown-defined subagents (researcher/coder/scribe/reviewer): rewrite
 *     their .opencode/agents/<id>.md frontmatter + ctx.agent.reload()
 *   - built-in registry subagents (explore): a fresh ctx.agent.transform pin
 *   - the current session's primary: ctx.session.switchModel (only when the
 *     session's live model still matches the failing source)
 * plan/build are intentionally NOT pinned by any of these (see the profile
 * plugin header): they follow the session model, so switchModel covers them.
 *
 * The overlay is persisted to .opencode/profile-fallback.json so it survives
 * restarts (state parsed at the file boundary into a trusted FailoverState;
 * malformed state is warned about and treated as absent). A tail of decisions
 * is appended to .opencode/profile-fallback.log — one line per event; the log
 * is rotated to .log.1 once it exceeds 1 MB (MAX_LOG_BYTES).
 *
 * Hydrology:
 *   A HARD quota/billing failure (status 429, or text matching quota/
 *   insufficient/credits/billing/payment) will not recover on retry and
 *   activates immediately — even on attempt 1 — from either the retry hook or
 *   the http.response hook (429/402). A SOFT rate-limit failure (rate-limit/
 *   too-many-requests text with no 429) may clear up, so it only activates
 *   once the retry hook sees it on the SECOND attempt or later (attempt >= 2).
 *   Activation records + applies overrides for 30 min (FAILOVER_TTL_MS), then
 *   auto-reverts (re-apply the stored profile). A 5 min cooldown (COOLDOWN_MS)
 *   suppresses re-activation flapping after a revert; skip decisions are
 *   logged at most once per episode (no spam). A quota error on an
 *   already-active FALLBACK model never triggers an auto-revert — it is only
 *   logged. Both trigger channels funnel through one promise-chain mutex
 *   (withMutex) and the already-failed-over guard, so the same failure can
 *   only activate once. A manual reset can never be resurrected by an
 *   in-flight activation, and plugin hot-reload disposes every hook it
 *   registered (see installFailover's cleanup).
 */

import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { Plugin } from '@opencode/plugin'
import {
  formatRef,
  formatValue,
  isMissingFileError,
  parseModelRef,
  toMessage,
  type ModelRef,
  type ModelRefShape,
} from './shared'

/** How long a failover activation stays applied before auto-revert (ms). */
export const FAILOVER_TTL_MS = 30 * 60_000

/** Min interval between a revert and the next activation (ms). */
export const COOLDOWN_MS = 5 * 60_000

const STATE_FILENAME = 'profile-fallback.json'
const LOG_FILENAME = 'profile-fallback.log'

/** Rotate the audit log when it exceeds this size (bytes). */
const MAX_LOG_BYTES = 1024 * 1024

/**
 * HARD quota/billing failures: the subscription wall is hit, so retrying the
 * same model cannot recover — activate on the first attempt.
 */
const HARD_QUOTA_PATTERN = /(quota|insufficient|credits?|billing|payment)/i

/**
 * SOFT rate-limit failures: may be transient, so they only activate once a
 * retry has already failed (attempt >= 2). Kept separate from the hard pattern
 * so "too many requests" does not fail over prematurely.
 */
const SOFT_QUOTA_PATTERN = /(rate.?limit|too many requests)/i

/** The profile shape failover consumes (structurally compatible with index.ts). */
export interface ActiveProfile {
  primary: ModelRef
  agents: Record<string, ModelRef>
}

interface FailoverOverride {
  from: ModelRef
  to: ModelRef
}

/** Trusted failover state — parsed once at the state-file boundary. */
interface FailoverState {
  active: boolean
  dryRun: boolean
  overrides: Record<string, FailoverOverride>
  primaryFrom: ModelRef | null
  primaryTo: ModelRef | null
  activatedAt: number
  until: number
  cooldownUntil: number
}

export interface FailoverDeps {
  directory: string
  getActiveProfile: () => ActiveProfile | null
  writeAgentModelFrontmatter: (agentId: string, modelRef: ModelRef) => Promise<boolean>
  applyProfilePins: (profile: ActiveProfile) => Promise<readonly string[]>
  agentIds: readonly string[]
  markdownAgentIds: ReadonlySet<string>
  registryAgentIds: ReadonlySet<string>
  warn: (message: string) => void
}

export interface FailoverTestInput {
  sessionID: string
  argText: string
}

export interface FailoverAPI {
  reset: () => Promise<void>
  runTest: (input: FailoverTestInput) => Promise<string>
  cleanup: () => Promise<void>
}

interface FailoverTrigger {
  source: ModelRef
  sessionID: string
  reason: string
  dryRun?: boolean
  /**
   * Skip the post-revert cooldown gate. Used only by the explicit
   * /profile-failover-test command, which must be able to force a run even
   * right after a revert; real trigger paths always honour the cooldown.
   */
  bypassCooldown?: boolean
}

type FailoverOutcome =
  | {
      kind: 'activated'
      from: ModelRef
      to: ModelRef
      agentsSwitched: readonly string[]
      primarySwitched: boolean
    }
  | {
      kind: 'dry-run'
      from: ModelRef
      to: ModelRef
      agentsSwitched: readonly string[]
      primarySwitched: boolean
    }
  | { kind: 'skipped'; cause: string }

type FailoverPlan = {
  agentSwitches: ReadonlyArray<{ agentId: string; to: ModelRef }>
  primarySwitched: boolean
}

// ─── In-process overlay state (the durable file is re-read on install) ───

let state: FailoverState | null = null
let ttlTimer: ReturnType<typeof setTimeout> | null = null
let cooldownMemory = 0
let transformRegistrations: Array<{ dispose: () => Promise<void> }> = []
let lastSkipKey: string | null = null
let lastSkipAt = 0

/**
 * Serializes every mutating entry point (activation, revert, reset, dry-run
 * arm/disarm). Each op enqueues after the previous one (previous.then(run,
 * run)), so ops never interleave: a manual reset either runs before an
 * activation commits (and is then cleared by the exact same activation
 * attempt's re-check) or after it (and clears it) — never in between, so an
 * in-flight activation can't resurrect an overlay the reset removed.
 */
let mutex: Promise<unknown> = Promise.resolve()

const withMutex = <T>(run: () => Promise<T>): Promise<T> => {
  const op = mutex.then(run, run)
  mutex = op.then(
    () => undefined,
    () => undefined,
  )
  return op
}

/** "providerID/id" — the canonical key a pair matches on (variant ignored). */
const refKey = (ref: ModelRefShape): string => `${ref.providerID}/${ref.id}`

/**
 * Model alternatives: <source> -> <fallback>, matched on providerID+id
 * (variant ignored). The alternative is used as written — no variant carried
 * over from the source.
 */
const FAILOVER_PAIRS: ReadonlyArray<{ fromKey: string; target: ModelRef }> = [
  { fromKey: 'zai-coding-plan/glm-5.3-flash', target: parseModelRef('opencode-go/glm-5.3-flash') },
  { fromKey: 'zai-coding-plan/glm-5.3', target: parseModelRef('opencode-go/glm-5.3') },
  { fromKey: 'opencode/big-pickle', target: parseModelRef('opencode-go/deepseek-v4.1-flash') },
]

const findFailoverTarget = (source: ModelRef): ModelRef | null => {
  const sourceKey = refKey(source)
  const pair = FAILOVER_PAIRS.find(entry => entry.fromKey === sourceKey)
  return pair ? pair.target : null
}

/** How recoverable a quota-ish error is: `hard` fails over now, `soft` waits for a retry. */
type QuotaSeverity = 'hard' | 'soft' | 'none'

/**
 * Classify a provider error into hard/soft/none. `hard` covers status 429 and
 * quota/billing text (no retry can clear a subscription wall); `soft` covers
 * rate-limit/too-many-requests text that a backoff may clear.
 */
const classifyQuotaError = (error: {
  type: string
  message: string
  status?: number
}): QuotaSeverity => {
  if (error.status === 429) return 'hard'
  const haystack = `${error.type} ${error.message}`
  if (HARD_QUOTA_PATTERN.test(haystack)) return 'hard'
  if (SOFT_QUOTA_PATTERN.test(haystack)) return 'soft'
  return 'none'
}

/**
 * The effective model for an agent: a live failover override wins over the
 * profile's own value. Used by the profile plugin's base registry transform
 * AND by failover re-apply, so both paths agree on the overlay.
 */
export const resolveAgentModel = (
  profile: ActiveProfile,
  agentId: string,
): ModelRef | undefined => {
  const override = state?.overrides[agentId]
  if (override) return override.to
  return profile.agents[agentId]
}

// ─── State file boundary (parse once, trust afterwards) ───

const parseIsoTime = (value: unknown, field: string): number => {
  if (typeof value !== 'string') {
    throw new Error(`${field}: expected an ISO timestamp string, got ${formatValue(value)}`)
  }
  const time = Date.parse(value)
  if (Number.isNaN(time)) {
    throw new Error(`${field}: "${value}" is not a valid ISO timestamp`)
  }
  return time
}

const parseOverride = (agentId: string, raw: unknown): FailoverOverride => {
  if (typeof raw !== 'object' || !raw) {
    throw new Error(`overrides["${agentId}"]: expected {from, to}, got ${formatValue(raw)}`)
  }
  const override = raw as Record<string, unknown>
  if (typeof override.from !== 'string' || typeof override.to !== 'string') {
    throw new Error(
      `overrides["${agentId}"]: expected "provider/model" strings for from/to, got ${formatValue(raw)}`,
    )
  }
  return { from: parseModelRef(override.from), to: parseModelRef(override.to) }
}

/**
 * Parse the persisted state file at the boundary into a trusted FailoverState.
 * Malformed content is warned about and treated as absent (returns null) —
 * a corrupt overlay must never crash the plugin or wedge the profile.
 */
const parseDurableState = (
  source: string,
  warn: (message: string) => void,
): FailoverState | null => {
  let raw: unknown
  try {
    raw = JSON.parse(source)
  } catch (error) {
    warn(`failover: ${STATE_FILENAME} is not valid JSON (${toMessage(error)}) — treating as absent`)
    return null
  }
  try {
    const parsed = raw as Record<string, unknown>
    const overridesRaw = parsed.overrides
    if (typeof overridesRaw !== 'object' || !overridesRaw) {
      throw new Error(`overrides: expected an object, got ${formatValue(overridesRaw)}`)
    }
    const overrides: Record<string, FailoverOverride> = {}
    for (const [agentId, overrideRaw] of Object.entries(overridesRaw)) {
      overrides[agentId] = parseOverride(agentId, overrideRaw)
    }
    const primaryFrom =
      typeof parsed.primaryFrom === 'string' ? parseModelRef(parsed.primaryFrom) : null
    const primaryTo = typeof parsed.primaryTo === 'string' ? parseModelRef(parsed.primaryTo) : null
    return {
      active: parsed.active === true,
      dryRun: parsed.dryRun === true,
      overrides,
      primaryFrom,
      primaryTo,
      activatedAt: parseIsoTime(parsed.activatedAt, 'activatedAt'),
      until: parseIsoTime(parsed.until, 'until'),
      cooldownUntil: parseIsoTime(parsed.cooldownUntil, 'cooldownUntil'),
    }
  } catch (error) {
    warn(`failover: ${STATE_FILENAME} is malformed (${toMessage(error)}) — treating as absent`)
    return null
  }
}

const serializeState = (state: FailoverState): string =>
  JSON.stringify(
    {
      active: state.active,
      dryRun: state.dryRun,
      overrides: Object.fromEntries(
        Object.entries(state.overrides).map(([agentId, override]) => [
          agentId,
          { from: formatRef(override.from), to: formatRef(override.to) },
        ]),
      ),
      primaryFrom: state.primaryFrom ? formatRef(state.primaryFrom) : null,
      primaryTo: state.primaryTo ? formatRef(state.primaryTo) : null,
      activatedAt: new Date(state.activatedAt).toISOString(),
      until: new Date(state.until).toISOString(),
      cooldownUntil: new Date(state.cooldownUntil).toISOString(),
    },
    null,
    2,
  )

// ─── Log (append-only audit trail, rotated at install when too large) ───

type LogEvent = 'activate' | 'skip' | 'revert' | 'dry-run' | 'reset' | 'test-inject'

const buildLogLine = (
  event: LogEvent,
  targetName: string | null,
  from: ModelRef | null,
  to: ModelRef | null,
  reason: string,
): string =>
  [
    new Date().toISOString(),
    event,
    targetName ?? '-',
    from ? formatRef(from) : '-',
    '->',
    to ? formatRef(to) : '-',
    reason.replace(/\r?\n/g, '; '),
  ].join(' ')

const appendLog = async (
  logFilePath: string,
  line: string,
  warn: (message: string) => void,
): Promise<void> => {
  try {
    await fs.appendFile(logFilePath, `${line}\n`, 'utf8')
  } catch (error) {
    warn(`failover: could not append to ${LOG_FILENAME}: ${toMessage(error)}`)
  }
}

/** Move a too-large audit log aside (rotated file is overwritten). */
const rotateLogIfLarge = async (
  logFilePath: string,
  warn: (message: string) => void,
): Promise<void> => {
  try {
    const { size } = await fs.stat(logFilePath)
    if (size <= MAX_LOG_BYTES) return
    await fs.rename(logFilePath, `${logFilePath}.1`)
  } catch (error) {
    if (isMissingFileError(error)) return
    warn(`failover: could not rotate ${LOG_FILENAME}: ${toMessage(error)}`)
  }
}

/**
 * Log a skip decision, deduped per (reason, source-model) episode: at most one
 * line per cooldown window, so a flapping quota error cannot spam the log.
 */
const logSkip = async (
  logFilePath: string,
  warn: (message: string) => void,
  source: ModelRef | null,
  target: ModelRef | null,
  reason: string,
): Promise<void> => {
  const dedupKey = `${reason}\u0000${source ? refKey(source) : ''}`
  const now = Date.now()
  if (lastSkipKey === dedupKey && now - lastSkipAt < COOLDOWN_MS) return
  lastSkipKey = dedupKey
  lastSkipAt = now
  await appendLog(logFilePath, buildLogLine('skip', null, source, target, reason), warn)
}

// ─── Decisions ───

const isSourceAlreadyFailedOver = (state: FailoverState, sourceKey: string): boolean =>
  (state.primaryFrom !== null && refKey(state.primaryFrom) === sourceKey) ||
  Object.values(state.overrides).some(override => refKey(override.from) === sourceKey)

const isFallbackModel = (state: FailoverState, modelKey: string): boolean =>
  (state.primaryTo !== null && refKey(state.primaryTo) === modelKey) ||
  Object.values(state.overrides).some(override => refKey(override.to) === modelKey)

const isCooldownActive = (now: number): boolean =>
  now < Math.max(state?.cooldownUntil ?? 0, cooldownMemory)

const computeFailoverPlan = async (
  ctx: Plugin.Context,
  deps: FailoverDeps,
  source: ModelRef,
  target: ModelRef,
  sessionID: string,
): Promise<FailoverPlan> => {
  const sourceKey = refKey(source)
  const profile = deps.getActiveProfile()
  if (!profile) return { agentSwitches: [], primarySwitched: false }

  const agentSwitches: Array<{ agentId: string; to: ModelRef }> = []
  for (const agentId of deps.agentIds) {
    const effective = resolveAgentModel(profile, agentId)
    if (effective && refKey(effective) === sourceKey) {
      agentSwitches.push({ agentId, to: target })
    }
  }

  // Compare the failing source against the SESSION's live model (not just the
  // profile's primary), so a session switched via the TUI /models command
  // onto a failing model also gets failover. If the session cannot be read,
  // no primary switch is planned — safer than guessing.
  let primarySwitched = false
  try {
    const info = await ctx.session.get({ sessionID })
    if (info?.model) {
      primarySwitched = refKey(parseModelRef(formatRef(info.model))) === sourceKey
    }
  } catch (error) {
    deps.warn(`failover: could not read session model to plan primary switch: ${toMessage(error)}`)
  }

  return { agentSwitches, primarySwitched }
}

/** Merge the new switches into any existing overlay (activations accumulate per agent). */
const buildActivatedState = (
  previous: FailoverState | null,
  plan: FailoverPlan,
  source: ModelRef,
  target: ModelRef,
  now: number,
): FailoverState => {
  const overrides: Record<string, FailoverOverride> = { ...(previous?.overrides ?? {}) }
  for (const { agentId, to } of plan.agentSwitches) {
    overrides[agentId] = { from: source, to }
  }
  return {
    active: true,
    dryRun: false,
    overrides,
    primaryFrom: previous?.primaryFrom ?? (plan.primarySwitched ? source : null),
    primaryTo: previous?.primaryTo ?? (plan.primarySwitched ? target : null),
    activatedAt: now,
    until: now + FAILOVER_TTL_MS,
    cooldownUntil: now + COOLDOWN_MS,
  }
}

// ─── Apply (same mechanisms as the profile plugin) ───

/**
 * Apply agent targets. Registry pins created during THIS attempt live in a
 * local list and are merged into the global overlay only on success — if
 * ctx.agent.reload() fails mid-way, the partial pins are disposed here so a
 * failed activation leaves no half-applied registry mutation behind (the
 * exposure is logged; markdown frontmatter writes stay as best-effort).
 */
const applyAgentTargets = async (
  ctx: Plugin.Context,
  deps: FailoverDeps,
  targets: ReadonlyArray<{ agentId: string; to: ModelRef }>,
  context: string,
): Promise<void> => {
  const errors: string[] = []
  const localRegistrations: Array<{ dispose: () => Promise<void> }> = []

  for (const { agentId, to } of targets) {
    if (!deps.markdownAgentIds.has(agentId)) continue
    try {
      await deps.writeAgentModelFrontmatter(agentId, to)
    } catch (error) {
      errors.push(`${agentId}: ${toMessage(error)}`)
    }
  }

  const registryTargets = targets.filter(({ agentId }) => deps.registryAgentIds.has(agentId))
  if (registryTargets.length > 0) {
    const registration = await ctx.agent.transform(editor => {
      for (const { agentId, to } of registryTargets) {
        const agent = editor.get(agentId)
        if (!agent) continue
        editor.update(agentId, agent => {
          agent.model = to
        })
      }
    })
    localRegistrations.push(registration)
  }

  try {
    await ctx.agent.reload()
  } catch (error) {
    for (const registration of localRegistrations) {
      try {
        await registration.dispose()
      } catch (disposeError) {
        deps.warn(
          `failover (${context}): could not dispose partial agent transform: ${toMessage(disposeError)}`,
        )
      }
    }
    deps.warn(`failover (${context}): partial apply exposed then rolled back — ${toMessage(error)}`)
    throw error
  }

  // Success: the registrations are now part of the durable overlay and are
  // disposed by revert/reset/cleanup together with any previously applied ones.
  transformRegistrations.push(...localRegistrations)
  if (errors.length > 0) {
    deps.warn(`failover (${context}): agent frontmatter errors: ${errors.join(', ')}`)
  }
}

const switchSessionPrimaryIfStillOnSource = async (
  ctx: Plugin.Context,
  deps: FailoverDeps,
  sessionID: string,
  nextState: FailoverState,
): Promise<void> => {
  if (!nextState.primaryFrom || !nextState.primaryTo) return
  try {
    const info = await ctx.session.get({ sessionID })
    if (!info?.model || refKey(info.model) !== refKey(nextState.primaryFrom)) return
    await ctx.session.switchModel({ sessionID, model: nextState.primaryTo })
  } catch (error) {
    deps.warn(`failover: could not switch session primary: ${toMessage(error)}`)
  }
}

const persistState = async (
  stateFilePath: string,
  nextState: FailoverState,
  warn: (message: string) => void,
): Promise<void> => {
  try {
    const tmpPath = `${stateFilePath}.tmp`
    await fs.writeFile(tmpPath, serializeState(nextState), 'utf8')
    await fs.rename(tmpPath, stateFilePath)
  } catch (error) {
    warn(`failover: could not persist ${STATE_FILENAME}: ${toMessage(error)}`)
  }
}

const removeStateFile = async (
  stateFilePath: string,
  warn: (message: string) => void,
): Promise<boolean> => {
  try {
    await fs.unlink(stateFilePath)
    return true
  } catch (error) {
    if (isMissingFileError(error)) return false
    warn(`failover: could not remove ${STATE_FILENAME}: ${toMessage(error)}`)
    return false
  }
}

const disposeRegistrations = async (deps: FailoverDeps, context: string): Promise<void> => {
  for (const registration of transformRegistrations) {
    try {
      await registration.dispose()
    } catch (error) {
      deps.warn(`failover (${context}): could not dispose agent transform: ${toMessage(error)}`)
    }
  }
  transformRegistrations = []
}

const scheduleTtlRevert = (
  deps: FailoverDeps,
  ctx: Plugin.Context,
  stateFilePath: string,
  logFilePath: string,
  nextState: FailoverState,
): void => {
  if (ttlTimer) {
    clearTimeout(ttlTimer)
    ttlTimer = null
  }
  const remaining = Math.max(0, nextState.until - Date.now())
  ttlTimer = setTimeout(() => {
    void revertFailover(deps, ctx, stateFilePath, logFilePath, 'TTL expired')
  }, remaining)
}

/**
 * Auto-revert: forget the overlay (delete the state file), dispose the extra
 * registry pins, and re-apply the stored profile so its frontmatter wins again.
 * The session primary follows on the next session — switchModel is per-session.
 */
const revertFailoverInner = async (
  deps: FailoverDeps,
  ctx: Plugin.Context,
  stateFilePath: string,
  logFilePath: string,
  reason: string,
): Promise<void> => {
  if (ttlTimer) {
    clearTimeout(ttlTimer)
    ttlTimer = null
  }
  await disposeRegistrations(deps, 'revert')
  await removeStateFile(stateFilePath, deps.warn)
  await appendLog(logFilePath, buildLogLine('revert', null, null, null, reason), deps.warn)

  const profile = deps.getActiveProfile()
  if (profile) {
    const errors = await deps.applyProfilePins(profile)
    if (errors.length > 0) {
      deps.warn(`failover (revert): frontmatter errors: ${errors.join(', ')}`)
    }
  }

  // Reload is best-effort here: if it throws, the TTL call site's `void
  // revertFailover(...)` would turn it into an unhandled rejection and —
  // worse — state/cooldown below would never be set, wedging the in-memory
  // overlay (stale registry pin, "fallback already active" forever, no TTL
  // ever again). Warn and clear anyway.
  try {
    await ctx.agent.reload()
  } catch (error) {
    deps.warn(`failover (revert): could not reload agents — ${toMessage(error)}`)
  }

  state = null
  cooldownMemory = Date.now() + COOLDOWN_MS
}

const revertFailover = (
  deps: FailoverDeps,
  ctx: Plugin.Context,
  stateFilePath: string,
  logFilePath: string,
  reason: string,
): Promise<void> =>
  withMutex(() => revertFailoverInner(deps, ctx, stateFilePath, logFilePath, reason))

// ─── Activation (shared by the retry hook and the test command) ───

const activateFailoverInner = async (
  ctx: Plugin.Context,
  deps: FailoverDeps,
  stateFilePath: string,
  logFilePath: string,
  trigger: FailoverTrigger,
): Promise<FailoverOutcome> => {
  const entryState = state
  const sourceKey = refKey(trigger.source)
  const target = findFailoverTarget(trigger.source)
  const now = Date.now()

  if (!target) {
    await logSkip(logFilePath, deps.warn, trigger.source, null, `no failover pair for ${sourceKey}`)
    return { kind: 'skipped', cause: `no failover pair for ${sourceKey}` }
  }

  const plan = await computeFailoverPlan(ctx, deps, trigger.source, target, trigger.sessionID)
  const switchedTargets = [
    ...(plan.primarySwitched ? ['primary'] : []),
    ...plan.agentSwitches.map(({ agentId }) => agentId),
  ]

  if (trigger.dryRun === true || state?.dryRun === true) {
    for (const targetName of switchedTargets.length > 0 ? switchedTargets : [null]) {
      await appendLog(
        logFilePath,
        buildLogLine(
          'dry-run',
          targetName,
          trigger.source,
          target,
          `would switch (${trigger.reason})`,
        ),
        deps.warn,
      )
    }
    return {
      kind: 'dry-run',
      from: trigger.source,
      to: target,
      agentsSwitched: plan.agentSwitches.map(({ agentId }) => agentId),
      primarySwitched: plan.primarySwitched,
    }
  }

  if (!trigger.bypassCooldown && isCooldownActive(now)) {
    await logSkip(logFilePath, deps.warn, trigger.source, target, 'cooldown active — waiting')
    return { kind: 'skipped', cause: 'cooldown active' }
  }

  if (state && isSourceAlreadyFailedOver(state, sourceKey)) {
    await logSkip(
      logFilePath,
      deps.warn,
      trigger.source,
      target,
      `fallback already active for ${sourceKey}`,
    )
    return { kind: 'skipped', cause: `fallback already active for ${sourceKey}` }
  }

  if (state && isFallbackModel(state, sourceKey)) {
    await logSkip(
      logFilePath,
      deps.warn,
      trigger.source,
      target,
      'error on fallback model — no auto-revert',
    )
    return { kind: 'skipped', cause: 'error on fallback model — no auto-revert' }
  }

  if (!plan.primarySwitched && plan.agentSwitches.length === 0) {
    await logSkip(
      logFilePath,
      deps.warn,
      trigger.source,
      target,
      `no agents or primary run ${sourceKey}`,
    )
    return { kind: 'skipped', cause: `no agents or primary run ${sourceKey}` }
  }

  const nextState = buildActivatedState(state, plan, trigger.source, target, now)
  try {
    await applyAgentTargets(ctx, deps, plan.agentSwitches, 'activate')
    await switchSessionPrimaryIfStillOnSource(ctx, deps, trigger.sessionID, nextState)
  } catch (error) {
    // Never commit an overlay that was not actually applied: keep the previous
    // state (in-process + file) and only log.
    await logSkip(
      logFilePath,
      deps.warn,
      trigger.source,
      target,
      `activation failed: ${toMessage(error)}`,
    )
    return { kind: 'skipped', cause: `activation failed: ${toMessage(error)}` }
  }

  // The mutex guarantees no other op ran between entryState capture and here,
  // so this check is a cheap defensive invariant: if a future path mutates
  // state outside the mutex, a stale activation must not overwrite a newer
  // overlay (including one put in place by a manual reset).
  if (state !== entryState) {
    await logSkip(
      logFilePath,
      deps.warn,
      trigger.source,
      target,
      'state changed mid-activation — not committing',
    )
    return { kind: 'skipped', cause: 'state changed mid-activation' }
  }
  state = nextState
  await persistState(stateFilePath, nextState, deps.warn)
  scheduleTtlRevert(deps, ctx, stateFilePath, logFilePath, nextState)

  for (const targetName of switchedTargets) {
    await appendLog(
      logFilePath,
      buildLogLine('activate', targetName, trigger.source, target, trigger.reason),
      deps.warn,
    )
  }

  return {
    kind: 'activated',
    from: trigger.source,
    to: target,
    agentsSwitched: plan.agentSwitches.map(({ agentId }) => agentId),
    primarySwitched: plan.primarySwitched,
  }
}

const activateFailover = (
  ctx: Plugin.Context,
  deps: FailoverDeps,
  stateFilePath: string,
  logFilePath: string,
  trigger: FailoverTrigger,
): Promise<FailoverOutcome> =>
  withMutex(() => activateFailoverInner(ctx, deps, stateFilePath, logFilePath, trigger))

// ─── Retry hook (the real trigger) ───

const handleRetry = async (
  ctx: Plugin.Context,
  deps: FailoverDeps,
  stateFilePath: string,
  logFilePath: string,
  event: {
    sessionID: string
    model: ModelRef
    error: { type: string; message: string; status?: number }
    attempt: number
  },
): Promise<void> => {
  // Not a quota/limit error — leave opencode's retry decision untouched.
  const severity = classifyQuotaError(event.error)
  if (severity === 'none') return

  // A hard quota/billing failure cannot recover on retry, so it fails over on
  // the first attempt. A soft rate limit may be transient: only start failover
  // once the request failed on the second attempt or later (attempt >= 2).
  if (severity === 'soft' && event.attempt < 2) {
    await logSkip(logFilePath, deps.warn, event.model, null, 'first attempt')
    return
  }

  await activateFailover(ctx, deps, stateFilePath, logFilePath, {
    source: event.model,
    sessionID: event.sessionID,
    reason: [event.error.type, event.error.status ?? null].filter(Boolean).join(' '),
  })
}

// ─── http.response hook (second trigger channel) ───

/** Provider statuses that mean "quota/billing wall" — the same failures the retry hook reacts to. */
const HTTP_QUOTA_STATUSES: ReadonlySet<number> = new Set([402, 429])

/** Bodies are only sniffed for a human message; 200 chars is plenty for a provider error. */
const HTTP_ERROR_MESSAGE_MAX_CHARS = 200

/**
 * Read a short message out of a response WITHOUT consuming it: clone first,
 * then read the clone, so the original one-shot body still reaches opencode
 * intact. A read failure degrades to a placeholder — the status code alone is
 * enough to trigger failover — and never throws out of the hook.
 */
const readResponseMessage = async (response: Response): Promise<string> => {
  try {
    const text = await response.clone().text()
    return text.slice(0, HTTP_ERROR_MESSAGE_MAX_CHARS).replace(/\s+/g, ' ').trim()
  } catch (error) {
    return `(unreadable response body: ${toMessage(error)})`
  }
}

/**
 * Second trigger channel: the retry hook only sees failures opencode actually
 * retries, so a hard quota wall it gives up on would never activate failover.
 * Sniffing the raw response catches 429/402 immediately, even on attempt 1.
 * Both channels call the same mutex-serialized activation, and the second one
 * sees the first one's committed overlay via isSourceAlreadyFailedOver — so a
 * single failure can only activate once. The body is only touched on 429/402,
 * leaving normal (2xx) streaming responses untouched.
 */
const handleHttpResponse = async (
  ctx: Plugin.Context,
  deps: FailoverDeps,
  stateFilePath: string,
  logFilePath: string,
  event: {
    sessionID: string
    model: ModelRef
    response: Response
  },
): Promise<void> => {
  if (!HTTP_QUOTA_STATUSES.has(event.response.status)) return

  const message = await readResponseMessage(event.response)
  const error = { status: event.response.status, type: 'provider.quota', message }
  if (classifyQuotaError(error) === 'none') return

  await activateFailover(ctx, deps, stateFilePath, logFilePath, {
    source: event.model,
    sessionID: event.sessionID,
    reason: `${error.type} ${error.status}`,
  })
}

// ─── Test command helper ───

const buildTestReport = (outcome: FailoverOutcome): string => {
  if (outcome.kind === 'skipped') {
    return `⏭️  failover test skipped: ${outcome.cause}`
  }
  const targets = [...(outcome.primarySwitched ? ['primary'] : []), ...outcome.agentsSwitched]
  const list = targets.length > 0 ? targets.join(', ') : '(none)'
  if (outcome.kind === 'dry-run') {
    return `🧪 failover test (dry-run): would switch ${list} ${formatRef(outcome.from)} -> ${formatRef(outcome.to)} — nothing applied, nothing persisted`
  }
  return `✅ failover test: activated — switched ${list} ${formatRef(outcome.from)} -> ${formatRef(outcome.to)} (TTL ${FAILOVER_TTL_MS / 60_000} min)`
}

const persistDryRunMarker = async (
  stateFilePath: string,
  warn: (message: string) => void,
): Promise<FailoverState> => {
  const now = Date.now()
  const marker: FailoverState = {
    active: false,
    dryRun: true,
    overrides: {},
    primaryFrom: null,
    primaryTo: null,
    activatedAt: now,
    until: now + FAILOVER_TTL_MS,
    cooldownUntil: now + COOLDOWN_MS,
  }
  await persistState(stateFilePath, marker, warn)
  return marker
}

/**
 * Arm rehearsal mode in-process: store the marker, write it durably, and
 * schedule its TTL lapse so real failover resumes on its own. The guard that
 * refuses to arm over a live overlay lives INSIDE the mutex (not at the test
 * call site), so a rehearsal can never clobber real failover state even when
 * an activation was enqueued just before this op.
 */
const armDryRunMarkerInner = async (
  ctx: Plugin.Context,
  deps: FailoverDeps,
  stateFilePath: string,
  logFilePath: string,
): Promise<void> => {
  if (state?.active === true) return
  if (ttlTimer) {
    clearTimeout(ttlTimer)
    ttlTimer = null
  }
  const marker = await persistDryRunMarker(stateFilePath, deps.warn)
  state = marker
  scheduleTtlRevert(deps, ctx, stateFilePath, logFilePath, marker)
}

const armDryRunMarker = (
  ctx: Plugin.Context,
  deps: FailoverDeps,
  stateFilePath: string,
  logFilePath: string,
): Promise<void> => withMutex(() => armDryRunMarkerInner(ctx, deps, stateFilePath, logFilePath))

/**
 * An explicit real test disarms a rehearsal marker (file + in-process). Like
 * arming, the "was it actually in dry-run mode" check happens inside the mutex.
 */
const disarmDryRunMarkerInner = async (
  deps: FailoverDeps,
  stateFilePath: string,
  logFilePath: string,
): Promise<void> => {
  if (!state?.dryRun) return
  if (ttlTimer) {
    clearTimeout(ttlTimer)
    ttlTimer = null
  }
  await disposeRegistrations(deps, 'test disarm')
  await removeStateFile(stateFilePath, deps.warn)
  await appendLog(
    logFilePath,
    buildLogLine('reset', null, null, null, 'test disarm — dry-run mode cleared'),
    deps.warn,
  )
  state = null
  cooldownMemory = 0
}

const disarmDryRunMarker = (
  deps: FailoverDeps,
  stateFilePath: string,
  logFilePath: string,
): Promise<void> => withMutex(() => disarmDryRunMarkerInner(deps, stateFilePath, logFilePath))

const runFailoverTest = async (
  ctx: Plugin.Context,
  deps: FailoverDeps,
  stateFilePath: string,
  logFilePath: string,
  input: FailoverTestInput,
): Promise<string> => {
  const args = input.argText.trim().split(/\s+/).filter(Boolean)
  const dry = args[0] === 'dry'
  const modelArg = dry ? args[1] : args[0]

  let source: ModelRef
  if (modelArg) {
    try {
      source = parseModelRef(modelArg)
    } catch (error) {
      return `❌ failover test: "${modelArg}" is not a valid model ref (expected provider/model[#variant]): ${toMessage(error)}`
    }
  } else {
    const info = await ctx.session.get({ sessionID: input.sessionID })
    if (!info?.model) {
      return '❌ failover test: current session has no model — pass one explicitly, e.g. /profile-failover-test zai-coding-plan/glm-5.3'
    }
    // SessionInfo.model is the plain, unbranded ref shape — normalize at the
    // boundary (Model.Ref.parse) so the trusted domain type wins from here on.
    source = parseModelRef(formatRef(info.model))
  }

  await appendLog(
    logFilePath,
    buildLogLine('test-inject', null, source, null, 'injected test error'),
    deps.warn,
  )

  // "dry" arms dry-run mode (persisted marker) so this AND subsequent real
  // quota events only log — a rehearsal until the marker lapses or a real
  // activation overwrites it. An explicit real test disarms the marker so a
  // `dry` rehearsal followed by a real test actually activates.
  if (dry) {
    await armDryRunMarker(ctx, deps, stateFilePath, logFilePath)
  } else {
    await disarmDryRunMarker(deps, stateFilePath, logFilePath)
  }

  const outcome = await activateFailover(ctx, deps, stateFilePath, logFilePath, {
    source,
    sessionID: input.sessionID,
    reason: 'injected test error',
    dryRun: dry,
    // An explicit test must run even right after a revert — it is the one path
    // allowed to jump the cooldown gate.
    bypassCooldown: true,
  })

  return buildTestReport(outcome)
}

const resetFailoverInner = async (
  deps: FailoverDeps,
  stateFilePath: string,
  logFilePath: string,
): Promise<void> => {
  if (ttlTimer) {
    clearTimeout(ttlTimer)
    ttlTimer = null
  }
  await disposeRegistrations(deps, 'reset')
  const removed = await removeStateFile(stateFilePath, deps.warn)
  if (removed) {
    await appendLog(
      logFilePath,
      buildLogLine('reset', null, null, null, 'manual profile switch — failover cleared'),
      deps.warn,
    )
  }
  state = null
  cooldownMemory = 0
}

const resetFailover = (
  deps: FailoverDeps,
  stateFilePath: string,
  logFilePath: string,
): Promise<void> => withMutex(() => resetFailoverInner(deps, stateFilePath, logFilePath))

const reapplyPersistedState = async (
  ctx: Plugin.Context,
  deps: FailoverDeps,
  persisted: FailoverState,
): Promise<void> => {
  const targets = Object.entries(persisted.overrides).map(([agentId, override]) => ({
    agentId,
    to: override.to,
  }))
  await applyAgentTargets(ctx, deps, targets, 'reapply at startup')
}

/**
 * Mount the failover machinery: rotate the log if too large, recover persisted
 * state on startup, register the retry + http.response hooks, and expose the
 * reset/test API for the profile plugin. Returns a cleanup — the plugin's setup
 * hands it to the SDK — that clears the TTL timer, disposes every agent
 * transform this module registered, and unregisters both hooks, so hot-reload
 * leaves nothing behind.
 */
export const installFailover = async (
  ctx: Plugin.Context,
  deps: FailoverDeps,
): Promise<FailoverAPI> => {
  const stateFilePath = path.join(deps.directory, '.opencode', STATE_FILENAME)
  const logFilePath = path.join(deps.directory, '.opencode', LOG_FILENAME)

  await rotateLogIfLarge(logFilePath, deps.warn)

  let persisted: FailoverState | null = null
  try {
    const source = await fs.readFile(stateFilePath, 'utf8')
    persisted = parseDurableState(source, deps.warn)
  } catch (error) {
    if (!isMissingFileError(error)) {
      deps.warn(`failover: could not read ${STATE_FILENAME}: ${toMessage(error)}`)
    }
  }

  if (persisted) {
    const now = Date.now()
    if (persisted.active && now < persisted.until) {
      // A live overlay survives restarts: re-apply it verbatim. Failure here
      // (e.g. a broken agent reload) degrades to an unapplied overlay — warn
      // and continue, so a startup re-apply hiccup can never reject the
      // plugin setup; the TTL revert still cleans the stale overlay up.
      state = persisted
      try {
        await reapplyPersistedState(ctx, deps, persisted)
      } catch (error) {
        deps.warn(
          `failover: could not re-apply persisted overlay at startup — ${toMessage(error)}; overlay left unapplied`,
        )
      }
      scheduleTtlRevert(deps, ctx, stateFilePath, logFilePath, persisted)
    } else if (persisted.dryRun && now < persisted.until) {
      // A rehearsal marker: keep dry-run mode in-process until it lapses.
      state = persisted
      scheduleTtlRevert(deps, ctx, stateFilePath, logFilePath, persisted)
    } else if (persisted.active) {
      // An expired live overlay: revert (forget + re-apply the profile) and
      // enter cooldown so activation cannot immediately flap again.
      await revertFailover(deps, ctx, stateFilePath, logFilePath, 'expired at startup')
    } else if (persisted.dryRun) {
      // A stale rehearsal marker: delete it and log, but do NOT enter
      // cooldown — a rehearsal that lapsed must not delay real failover.
      await removeStateFile(stateFilePath, deps.warn)
      await appendLog(
        logFilePath,
        buildLogLine('dry-run', null, null, null, 'dry-run-expired'),
        deps.warn,
      )
      state = null
    }
  }

  const retryRegistration = await ctx.session.hook('retry', event =>
    handleRetry(ctx, deps, stateFilePath, logFilePath, event),
  )

  const httpResponseRegistration = await ctx.session.hook('http.response', event =>
    handleHttpResponse(ctx, deps, stateFilePath, logFilePath, event),
  )

  const cleanup = async (): Promise<void> => {
    if (ttlTimer) {
      clearTimeout(ttlTimer)
      ttlTimer = null
    }
    await disposeRegistrations(deps, 'cleanup')
    try {
      await retryRegistration.dispose()
    } catch (error) {
      deps.warn(`failover: could not dispose retry hook: ${toMessage(error)}`)
    }
    try {
      await httpResponseRegistration.dispose()
    } catch (error) {
      deps.warn(`failover: could not dispose http.response hook: ${toMessage(error)}`)
    }
  }

  return {
    reset: () => resetFailover(deps, stateFilePath, logFilePath),
    runTest: input => runFailoverTest(ctx, deps, stateFilePath, logFilePath, input),
    cleanup,
  }
}
