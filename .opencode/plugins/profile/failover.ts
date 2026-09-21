/**
 * failover — adaptive model failover for the profile plugin.
 *
 * Mounted by plugins/profile/index.ts (installFailover). Watches the session
 * retry hook for QUOTA/rate-limit failures and — when the failing model has a
 * configured alternative (FAILOVER_PAIRS) — switches EVERY agent that is
 * running that model to the alternative, using the same apply mechanisms the
 * profile plugin already owns:
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
 * is appended to .opencode/profile-fallback.log — one line per event, never
 * truncated.
 *
 * Hydrology:
 *   activate (quota on a source model) → overrides recorded + applied for 30
 *   min (FAILOVER_TTL_MS), then auto-reverted (re-apply the stored profile).
 *   A 5 min cooldown (COOLDOWN_MS) suppresses re-activation flapping after a
 *   revert. A quota error on an already-active FALLBACK model never triggers
 *   an auto-revert — it is only logged.
 */

import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { Model, Plugin } from '@opencode/plugin'

/** How long a failover activation stays applied before auto-revert (ms). */
export const FAILOVER_TTL_MS = 30 * 60_000

/** Min interval between a revert and the next activation (ms). */
export const COOLDOWN_MS = 5 * 60_000

const STATE_FILENAME = 'profile-fallback.json'
const LOG_FILENAME = 'profile-fallback.log'

const QUOTA_PATTERN = /(quota|insufficient|credits?|rate.?limit|exceeded|billing|payment)/i

type ModelRef = Model.Ref

/** Boundary shape of a model ref (SessionInfo.model is the plain, unbranded form). */
type ModelRefShape = { providerID: string; id: string; variant?: string }

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
}

interface FailoverTrigger {
  source: ModelRef
  sessionID: string
  reason: string
  dryRun?: boolean
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

/** "providerID/id" — the canonical key a pair matches on (variant ignored). */
const refKey = (ref: ModelRefShape): string => `${ref.providerID}/${ref.id}`

/** Render a model ref back to its "provider/model[#variant]" string form. */
const formatRef = (ref: ModelRefShape): string =>
  ref.variant ? `${ref.providerID}/${ref.id}#${ref.variant}` : `${ref.providerID}/${ref.id}`

const parseModelRef = (raw: string): ModelRef => Model.Ref.parse(raw)

const toMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error))

const isMissingFileError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT'

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

const isQuotaError = (error: { type: string; message: string; status?: number }): boolean =>
  error.status === 429 || QUOTA_PATTERN.test(`${error.type} ${error.message}`)

/**
 * The effective model for an agent: a live failover override wins over the
 * profile's own value. Used by the profile plugin's base registry transform
 * AND by failover re-apply, so both paths agree on the overlay.
 */
export const resolveAgentModel = (profile: ActiveProfile, agentId: string): ModelRef | undefined => {
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

const formatValue = (value: unknown): string => {
  if (typeof value === 'string') return `"${value}"`
  if (value === null) return 'null'
  if (typeof value === 'object') return JSON.stringify(value) ?? String(value)
  return String(value)
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
const parseDurableState = (source: string, warn: (message: string) => void): FailoverState | null => {
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
    const primaryFrom = typeof parsed.primaryFrom === 'string' ? parseModelRef(parsed.primaryFrom) : null
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

// ─── Log (append-only audit trail) ───

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
    reason,
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

// ─── Decisions ───

const isSourceAlreadyFailedOver = (state: FailoverState, sourceKey: string): boolean =>
  (state.primaryFrom !== null && refKey(state.primaryFrom) === sourceKey) ||
  Object.values(state.overrides).some(override => refKey(override.from) === sourceKey)

const isFallbackModel = (state: FailoverState, modelKey: string): boolean =>
  (state.primaryTo !== null && refKey(state.primaryTo) === modelKey) ||
  Object.values(state.overrides).some(override => refKey(override.to) === modelKey)

const isCooldownActive = (now: number): boolean =>
  now < Math.max(state?.cooldownUntil ?? 0, cooldownMemory)

const computeFailoverPlan = (deps: FailoverDeps, source: ModelRef, target: ModelRef): FailoverPlan => {
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
  return { agentSwitches, primarySwitched: refKey(profile.primary) === sourceKey }
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

const applyAgentTargets = async (
  ctx: Plugin.Context,
  deps: FailoverDeps,
  targets: ReadonlyArray<{ agentId: string; to: ModelRef }>,
  context: string,
): Promise<void> => {
  const errors: string[] = []

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
    transformRegistrations.push(registration)
  }

  await ctx.agent.reload()
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
    await fs.writeFile(stateFilePath, serializeState(nextState), 'utf8')
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

const scheduleTtlRevert = async (
  deps: FailoverDeps,
  ctx: Plugin.Context,
  stateFilePath: string,
  logFilePath: string,
  nextState: FailoverState,
): Promise<void> => {
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
const revertFailover = async (
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
  await ctx.agent.reload()

  state = null
  cooldownMemory = Date.now() + COOLDOWN_MS
}

// ─── Activation (shared by the retry hook and the test command) ───

const activateFailover = async (
  ctx: Plugin.Context,
  deps: FailoverDeps,
  stateFilePath: string,
  logFilePath: string,
  trigger: FailoverTrigger,
): Promise<FailoverOutcome> => {
  const sourceKey = refKey(trigger.source)
  const target = findFailoverTarget(trigger.source)
  const now = Date.now()

  if (!target) {
    await appendLog(
      logFilePath,
      buildLogLine('skip', null, trigger.source, null, `no failover pair for ${sourceKey}`),
      deps.warn,
    )
    return { kind: 'skipped', cause: `no failover pair for ${sourceKey}` }
  }

  const plan = computeFailoverPlan(deps, trigger.source, target)
  const switchedTargets = [
    ...(plan.primarySwitched ? ['primary'] : []),
    ...plan.agentSwitches.map(({ agentId }) => agentId),
  ]

  if (trigger.dryRun === true || state?.dryRun === true) {
    for (const targetName of switchedTargets.length > 0 ? switchedTargets : [null]) {
      await appendLog(
        logFilePath,
        buildLogLine('dry-run', targetName, trigger.source, target, `would switch (${trigger.reason})`),
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

  if (isCooldownActive(now)) {
    await appendLog(
      logFilePath,
      buildLogLine('skip', null, trigger.source, target, 'cooldown active — waiting'),
      deps.warn,
    )
    return { kind: 'skipped', cause: 'cooldown active' }
  }

  if (state && isSourceAlreadyFailedOver(state, sourceKey)) {
    await appendLog(
      logFilePath,
      buildLogLine('skip', null, trigger.source, target, `fallback already active for ${sourceKey}`),
      deps.warn,
    )
    return { kind: 'skipped', cause: `fallback already active for ${sourceKey}` }
  }

  if (state && isFallbackModel(state, sourceKey)) {
    await appendLog(
      logFilePath,
      buildLogLine('skip', null, trigger.source, target, 'error on fallback model — no auto-revert'),
      deps.warn,
    )
    return { kind: 'skipped', cause: 'error on fallback model — no auto-revert' }
  }

  if (!plan.primarySwitched && plan.agentSwitches.length === 0) {
    await appendLog(
      logFilePath,
      buildLogLine('skip', null, trigger.source, target, `no agents or primary run ${sourceKey}`),
      deps.warn,
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
    await appendLog(
      logFilePath,
      buildLogLine('skip', null, trigger.source, target, `activation failed: ${toMessage(error)}`),
      deps.warn,
    )
    return { kind: 'skipped', cause: `activation failed: ${toMessage(error)}` }
  }
  state = nextState
  await persistState(stateFilePath, nextState, deps.warn)
  await scheduleTtlRevert(deps, ctx, stateFilePath, logFilePath, nextState)

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

// ─── Retry hook (the real trigger) ───

const handleRetry = async (
  ctx: Plugin.Context,
  deps: FailoverDeps,
  stateFilePath: string,
  logFilePath: string,
  event: { sessionID: string; model: ModelRef; error: { type: string; message: string; status?: number } },
): Promise<void> => {
  // Not a quota/limit error — leave opencode's retry decision untouched.
  if (!isQuotaError(event.error)) return

  await activateFailover(ctx, deps, stateFilePath, logFilePath, {
    source: event.model,
    sessionID: event.sessionID,
    reason: [event.error.type, event.error.status ?? null].filter(Boolean).join(' '),
  })
}

// ─── Test command helper ───

const buildTestReport = (outcome: FailoverOutcome): string => {
  if (outcome.kind === 'skipped') {
    return `⏭️  failover test skipped: ${outcome.cause}`
  }
  const targets = [
    ...(outcome.primarySwitched ? ['primary'] : []),
    ...outcome.agentsSwitched,
  ]
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
 * schedule its TTL lapse so real failover resumes on its own. Never armed
 * over a live overlay — a rehearsal must not clobber real failover state.
 */
const armDryRunMarker = async (
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
  await scheduleTtlRevert(deps, ctx, stateFilePath, logFilePath, marker)
}

/** An explicit real test disarms a rehearsal marker (file + in-process). */
const disarmDryRunMarker = async (
  deps: FailoverDeps,
  stateFilePath: string,
  logFilePath: string,
): Promise<void> => {
  if (ttlTimer) {
    clearTimeout(ttlTimer)
    ttlTimer = null
  }
  await disposeRegistrations(deps, 'test disarm')
  await removeStateFile(stateFilePath, deps.warn)
  await appendLog(logFilePath, buildLogLine('reset', null, null, null, 'test disarm — dry-run mode cleared'), deps.warn)
  state = null
  cooldownMemory = 0
}

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
  if (dry && state?.active !== true) {
    await armDryRunMarker(ctx, deps, stateFilePath, logFilePath)
  } else if (!dry && state?.dryRun === true) {
    await disarmDryRunMarker(deps, stateFilePath, logFilePath)
  }

  const outcome = await activateFailover(ctx, deps, stateFilePath, logFilePath, {
    source,
    sessionID: input.sessionID,
    reason: 'injected test error',
    dryRun: dry,
  })

  return buildTestReport(outcome)
}

const resetFailover = async (
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
    await appendLog(logFilePath, buildLogLine('reset', null, null, null, 'manual profile switch — failover cleared'), deps.warn)
  }
  state = null
  cooldownMemory = 0
}

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
 * Mount the failover machinery: recover persisted state on startup, register
 * the retry hook, and expose the reset/test API for the profile plugin.
 */
export const installFailover = async (
  ctx: Plugin.Context,
  deps: FailoverDeps,
): Promise<FailoverAPI> => {
  const stateFilePath = path.join(deps.directory, '.opencode', STATE_FILENAME)
  const logFilePath = path.join(deps.directory, '.opencode', LOG_FILENAME)

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
    if (persisted.dryRun && now < persisted.until) {
      // A rehearsal marker: keep dry-run mode in-process until it lapses.
      state = persisted
      await scheduleTtlRevert(deps, ctx, stateFilePath, logFilePath, persisted)
    } else if (persisted.active && now < persisted.until) {
      // A live overlay survives restarts: re-apply it verbatim.
      state = persisted
      await reapplyPersistedState(ctx, deps, persisted)
      await scheduleTtlRevert(deps, ctx, stateFilePath, logFilePath, persisted)
    } else {
      await revertFailover(deps, ctx, stateFilePath, logFilePath, 'expired at startup')
    }
  }

  await ctx.session.hook('retry', event => handleRetry(ctx, deps, stateFilePath, logFilePath, event))

  return {
    reset: () => resetFailover(deps, stateFilePath, logFilePath),
    runTest: input => runFailoverTest(ctx, deps, stateFilePath, logFilePath, input),
  }
}