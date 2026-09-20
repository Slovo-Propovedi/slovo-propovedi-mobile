/**
 * background-agents
 * Unified delegation system for OpenCode
 *
 * Replaces native `task` tool with persistent, async-first agent delegation.
 * All agent outputs are persisted to storage, orchestrator receives only key references.
 *
 * Based on oh-my-opencode by @code-yeongyu (MIT License)
 * https://github.com/code-yeongyu/oh-my-opencode
 */

import * as fs from "node:fs/promises"
import * as os from "node:os"
import * as path from "node:path"
import { Plugin } from "@opencode/plugin"
import { adjectives, animals, colors, uniqueNamesGenerator } from "unique-names-generator"
import { getProjectId } from "../lib/kdco-primitives/get-project-id"
import type { OpencodeClient } from "../lib/kdco-primitives/types"

// ==========================================
// READABLE ID GENERATION
// ==========================================

function generateReadableId(): string {
	return uniqueNamesGenerator({
		dictionaries: [adjectives, colors, animals],
		separator: "-",
		length: 3,
		style: "lowerCase",
	})
}

// ==========================================
// METADATA GENERATION (using small_model)
// ==========================================

interface GeneratedMetadata {
	title: string
	description: string
}

/**
 * Generate title and description from result content using a model.
 * Falls back to truncation if no default model is available.
 *
 * TODO(port): V1 gated this on the `small_model` config key and prompted the
 * small model through a dedicated child session. V2 has no plugin-visible
 * `small_model` setting, so the selected default model is used via
 * `ctx.generate.text` (which needs no session). The `parentID` argument is
 * retained for signature compatibility and is unused in V2 (session creation
 * no longer accepts a parentID).
 */
async function generateMetadata(
	client: OpencodeClient,
	resultContent: string,
	parentID: string,
	debugLog: (msg: string) => Promise<void>,
): Promise<GeneratedMetadata> {
	void parentID

	const fallbackMetadata = (): GeneratedMetadata => {
		// Fallback: truncate first line/paragraph
		const firstLine =
			resultContent.split("\n").find((l) => l.trim().length > 0) || "Delegation result"
		const title = firstLine.slice(0, 30).trim() + (firstLine.length > 30 ? "..." : "")
		const description =
			resultContent.slice(0, 150).trim() + (resultContent.length > 150 ? "..." : "")
		return { title, description }
	}

	try {
		// Get the default model selection (V1: config.small_model gate)
		const defaultModelResult = await client.model.default()
		const model = defaultModelResult.data

		if (!model) {
			await debugLog("generateMetadata: No default model available, using fallback")
			return fallbackMetadata()
		}

		await debugLog(`generateMetadata: Using model ${model.providerID}/${model.id}`)

		const prompt = `Generate a title and description for this research result.

RULES:
- Title: 2-5 words, max 30 characters, sentence case
- Description: 2-3 sentences, max 150 characters, summarize key findings

RESULT CONTENT:
${resultContent.slice(0, 2000)}

Respond with ONLY valid JSON in this exact format:
{"title": "Your Title Here", "description": "Your description here."}`

		// Generate directly without a session, with a timeout safety net
		const PROMPT_TIMEOUT_MS = 30000
		const result = await Promise.race([
			client.generate.text({
				prompt,
				model: { providerID: model.providerID, id: model.id },
			}),
			new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error("Prompt timeout after 30s")), PROMPT_TIMEOUT_MS),
			),
		])

		// Extract the response text (V1 read text parts from the session prompt response)
		const text = result.text
		if (!text) {
			await debugLog("generateMetadata: No text in response")
			return fallbackMetadata()
		}

		// Parse JSON response
		const jsonMatch = text.match(/\{[\s\S]*\}/)
		if (!jsonMatch) {
			await debugLog(`generateMetadata: No JSON found in response: ${text}`)
			return fallbackMetadata()
		}

		const parsed = JSON.parse(jsonMatch[0]) as { title?: string; description?: string }
		if (!parsed.title || !parsed.description) {
			await debugLog("generateMetadata: Invalid JSON structure")
			return fallbackMetadata()
		}

		await debugLog(`generateMetadata: Generated title="${parsed.title}"`)
		return {
			title: parsed.title.slice(0, 30),
			description: parsed.description.slice(0, 150),
		}
	} catch (error) {
		await debugLog(
			`generateMetadata error: ${error instanceof Error ? error.message : "Unknown error"}`,
		)
		return fallbackMetadata()
	}
}

// ==========================================
// TYPE DEFINITIONS
// ==========================================

/**
 * V2 session message subset used for result extraction.
 * V1 used `{ info: Message; parts: Part[] }` items from `client.session.messages`;
 * V2 `ctx.session.context` returns a flat list of discriminated message objects
 * where assistant text lives in `content`.
 */
interface V2AssistantMessage {
	type: "assistant"
	content: ReadonlyArray<{ type: string; text?: string }>
}

type V2SessionMessage = { type: string; content?: ReadonlyArray<{ type: string; text?: string }> }

/**
 * V2 agent permission rule (from AgentInfo.permissions).
 * V1 read permission records from config (`{ edit: "deny", bash: { "*": "deny" } }`).
 */
interface V2PermissionRule {
	action: string
	resource: string
	effect: "allow" | "ask" | "deny"
}

type DelegationStatus = "registered" | "running" | "complete" | "error" | "cancelled" | "timeout"

type DelegationTerminalStatus = Extract<
	DelegationStatus,
	"complete" | "error" | "cancelled" | "timeout"
>

interface DelegationProgress {
	toolCalls: number
	lastUpdateAt: Date
	lastHeartbeatAt: Date
	lastMessage?: string
	lastMessageAt?: Date
}

interface DelegationNotificationState {
	terminalNotifiedAt?: Date
	terminalNotificationCount: number
}

interface ParentNotificationState {
	allCompleteNotifiedAt?: Date
	allCompleteNotificationCount: number
	allCompleteCycle: number
	allCompleteCycleToken: string
	allCompleteNotifiedCycle?: number
	allCompleteNotifiedCycleToken?: string
	allCompleteScheduledCycle?: number
	allCompleteScheduledCycleToken?: string
	allCompleteScheduledTimer?: ReturnType<typeof setTimeout>
}

interface DelegationRetrievalState {
	retrievedAt?: Date
	retrievalCount: number
	lastReaderSessionID?: string
}

interface DelegationArtifactState {
	filePath: string
	persistedAt?: Date
	byteLength?: number
	persistError?: string
}

interface DelegationRecord {
	id: string
	rootSessionID: string
	sessionID: string
	parentSessionID: string
	parentMessageID: string
	parentAgent: string
	prompt: string
	agent: string
	notificationCycle: number
	notificationCycleToken: string
	status: DelegationStatus
	createdAt: Date
	startedAt?: Date
	completedAt?: Date
	updatedAt: Date
	timeoutAt: Date
	progress: DelegationProgress
	notification: DelegationNotificationState
	retrieval: DelegationRetrievalState
	artifact: DelegationArtifactState
	error?: string
	title?: string
	description?: string
	result?: string
}

const DEFAULT_MAX_RUN_TIME_MS = 15 * 60 * 1000 // 15 minutes
const TERMINAL_WAIT_GRACE_MS = 10_000
const READ_POLL_INTERVAL_MS = 250
const ALL_COMPLETE_QUIET_PERIOD_MS = 50
const PARENT_NOTIFICATION_TIMEOUT_MS = 5_000

interface DelegateInput {
	parentSessionID: string
	parentMessageID: string
	parentAgent: string
	prompt: string
	agent: string
}

interface DelegationListItem {
	id: string
	status: DelegationStatus
	title?: string
	description?: string
	agent?: string
	unread?: boolean
}

interface DelegationManagerOptions {
	maxRunTimeMs?: number
	readPollIntervalMs?: number
	terminalWaitGraceMs?: number
	allCompleteQuietPeriodMs?: number
	idGenerator?: () => string
	metadataGenerator?: typeof generateMetadata
}

// ==========================================
// LOGGING HELPER
// ==========================================

/**
 * Create a structured logger.
 *
 * TODO(port): V1 sent log lines to `client.app.log` (OpenCode UI log panel);
 * the V2 plugin context has no logging domain, so log output goes to the
 * console (server console output lands in the OpenCode log file).
 */
function createLogger(_client: OpencodeClient) {
	const log = (level: "debug" | "info" | "warn" | "error", message: string) => {
		if (level === "debug") {
			console.log(`[background-agents] ${level}: ${message}`)
		} else if (level === "info") {
			console.info(`[background-agents] ${level}: ${message}`)
		} else if (level === "warn") {
			console.warn(`[background-agents] ${level}: ${message}`)
		} else {
			console.error(`[background-agents] ${level}: ${message}`)
		}
	}
	return {
		debug: (msg: string) => log("debug", msg),
		info: (msg: string) => log("info", msg),
		warn: (msg: string) => log("warn", msg),
		error: (msg: string) => log("error", msg),
	}
}

type Logger = ReturnType<typeof createLogger>

// ==========================================
// AGENT CAPABILITY DETECTION
// ==========================================

/**
 * Parse agent mode at boundary.
 * Returns trusted type indicating if agent is a sub-agent.
 */
async function parseAgentMode(
	client: OpencodeClient,
	agentName: string,
	log: Logger,
): Promise<{ isSubAgent: boolean }> {
	try {
		const result = await client.agent.list()
		const agents = (result.data ?? []) as { name: string; mode?: string }[]
		const agent = agents.find((a) => a.name === agentName)
		return { isSubAgent: agent?.mode === "subagent" }
	} catch (error) {
		// Fail-safe: Agent list errors shouldn't block task calls
		// Fail-loud: Log for observability
		log.warn(
			`Agent list fetch failed for "${agentName}", assuming non-sub-agent: ${error instanceof Error ? error.message : String(error)}`,
		)
		return { isSubAgent: false }
	}
}

/**
 * Check if a V2 agent permission ruleset denies an action globally.
 *
 * TODO(port): V1 read permission records from config, shaped like
 * `{ edit: "deny", bash: { "*": "deny" } }` and checked `entry === "deny"` or
 * `entry["*"] === "deny"`. V2 exposes the effective ruleset on AgentInfo as
 * `{ action, resource, effect }` rules; the wildcard gate is the last rule
 * whose resource is `"*"` (or `"**"`), mirroring the V1 `entry["*"]` check
 * ("last matching rule wins").
 */
function isActionGloballyDenied(rules: V2PermissionRule[], action: string): boolean {
	let denied = false
	for (const rule of rules) {
		if (rule.action !== action) continue
		if (rule.resource === "*" || rule.resource === "**") {
			denied = rule.effect === "deny"
		}
	}
	return denied
}

/**
 * Parse agent write capability at boundary.
 * Returns trusted type indicating if agent is read-only.
 *
 * An agent is read-only when ALL of: edit, write, and bash are denied.
 * Permission schema supports both simple ("deny") and pattern ({ "*": "deny" }) values.
 */
async function parseAgentWriteCapability(
	client: OpencodeClient,
	agentName: string,
	log: Logger,
): Promise<{ isReadOnly: boolean }> {
	try {
		const result = await client.agent.list()
		const agents = (result.data ?? []) as Array<{ name: string; permissions?: V2PermissionRule[] }>
		const agent = agents.find((a) => a.name === agentName)
		const permission = agent?.permissions ?? []

		const editDenied = isActionGloballyDenied(permission, "edit")
		const writeDenied = isActionGloballyDenied(permission, "write")
		const bashDenied = isActionGloballyDenied(permission, "bash")

		return { isReadOnly: editDenied && writeDenied && bashDenied }
	} catch (error) {
		// Fail-safe: Agent permission errors shouldn't block task calls
		// Fail-loud: Log for observability
		log.warn(
			`Agent permission fetch failed for "${agentName}", assuming write-capable: ${error instanceof Error ? error.message : String(error)}`,
		)
		return { isReadOnly: false }
	}
}

/**
 * DELEGATION MANAGER
 */
function isTerminalStatus(status: DelegationStatus): status is DelegationTerminalStatus {
	return (
		status === "complete" || status === "error" || status === "cancelled" || status === "timeout"
	)
}

function isActiveStatus(status: DelegationStatus): boolean {
	return status === "registered" || status === "running"
}

function normalizeId(value: string): string {
	return value.trim()
}

function parsePersistedStatus(raw: string | undefined): DelegationStatus {
	if (!raw) return "complete"
	if (raw === "registered") return "registered"
	if (raw === "running") return "running"
	if (raw === "complete") return "complete"
	if (raw === "error") return "error"
	if (raw === "cancelled") return "cancelled"
	if (raw === "timeout") return "timeout"
	return "complete"
}

class DelegationManager {
	private delegations: Map<string, DelegationRecord> = new Map()
	private delegationsBySession: Map<string, string> = new Map()
	private terminalWaiters: Map<string, { promise: Promise<void>; resolve: () => void }> = new Map()
	private timeoutTimers: Map<string, ReturnType<typeof setTimeout>> = new Map()
	private client: OpencodeClient
	private baseDir: string
	private log: Logger
	private maxRunTimeMs: number
	private readPollIntervalMs: number
	private terminalWaitGraceMs: number
	private allCompleteQuietPeriodMs: number
	private idGenerator: () => string
	private metadataGenerator: typeof generateMetadata
	private pendingByParent: Map<string, Set<string>> = new Map()
	private parentNotificationState: Map<string, ParentNotificationState> = new Map()
	private pendingNotifications: Map<string, string[]> = new Map()

	constructor(
		client: OpencodeClient,
		baseDir: string,
		log: Logger,
		options: DelegationManagerOptions = {},
	) {
		this.client = client
		this.baseDir = baseDir
		this.log = log
		this.maxRunTimeMs = options.maxRunTimeMs ?? DEFAULT_MAX_RUN_TIME_MS
		this.readPollIntervalMs = options.readPollIntervalMs ?? READ_POLL_INTERVAL_MS
		this.terminalWaitGraceMs = options.terminalWaitGraceMs ?? TERMINAL_WAIT_GRACE_MS
		this.allCompleteQuietPeriodMs = options.allCompleteQuietPeriodMs ?? ALL_COMPLETE_QUIET_PERIOD_MS
		this.idGenerator = options.idGenerator ?? generateReadableId
		this.metadataGenerator = options.metadataGenerator ?? generateMetadata
	}

	/**
	 * Resolves the root session ID by walking up the parent chain.
	 */
	async getRootSessionID(sessionID: string): Promise<string> {
		let currentID = sessionID
		// Prevent infinite loops with max depth
		for (let depth = 0; depth < 10; depth++) {
			try {
				const session = await this.client.session.get({ sessionID: currentID })

				if (!session.parentID) {
					return currentID
				}

				currentID = session.parentID
			} catch {
				// If we can't fetch the session, assume current is root or best effort
				return currentID
			}
		}
		return currentID
	}

	/**
	 * Get the delegations directory for a session scope (root session)
	 */
	private async getDelegationsDir(sessionID: string): Promise<string> {
		const rootID = await this.getRootSessionID(sessionID)
		return path.join(this.baseDir, rootID)
	}

	/**
	 * Ensure the delegations directory exists
	 */
	private async ensureDelegationsDir(sessionID: string): Promise<string> {
		const dir = await this.getDelegationsDir(sessionID)
		await fs.mkdir(dir, { recursive: true })
		return dir
	}

	private createTerminalWaiter(id: string): void {
		if (this.terminalWaiters.has(id)) return

		let resolve: (() => void) | undefined
		const promise = new Promise<void>((innerResolve) => {
			resolve = innerResolve
		})

		if (!resolve) {
			throw new Error(`Failed to initialize terminal waiter for delegation ${id}`)
		}

		this.terminalWaiters.set(id, { promise, resolve })
	}

	private resolveTerminalWaiter(id: string): void {
		const waiter = this.terminalWaiters.get(id)
		if (!waiter) return
		waiter.resolve()
	}

	private clearTimeoutTimer(id: string): void {
		const timer = this.timeoutTimers.get(id)
		if (!timer) return
		clearTimeout(timer)
		this.timeoutTimers.delete(id)
	}

	private scheduleTimeout(id: string): void {
		this.clearTimeoutTimer(id)
		const timer = setTimeout(() => {
			void this.handleTimeout(id)
		}, this.maxRunTimeMs + 5_000)
		this.timeoutTimers.set(id, timer)
	}

	private updateDelegation(
		id: string,
		mutate: (delegation: DelegationRecord, now: Date) => void,
	): DelegationRecord | undefined {
		const delegation = this.delegations.get(id)
		if (!delegation) return undefined

		const now = new Date()
		mutate(delegation, now)
		delegation.updatedAt = now
		return delegation
	}

	private registerDelegation(input: {
		id: string
		rootSessionID: string
		sessionID: string
		parentSessionID: string
		parentMessageID: string
		parentAgent: string
		prompt: string
		agent: string
		artifactPath: string
	}): DelegationRecord {
		if (!this.pendingByParent.has(input.parentSessionID)) {
			this.pendingByParent.set(input.parentSessionID, new Set())
			this.resetParentAllCompleteNotificationCycle(input.parentSessionID)
		}

		const parentNotificationState = this.getParentNotificationState(input.parentSessionID)
		const notificationCycle = parentNotificationState.allCompleteCycle
		const notificationCycleToken = parentNotificationState.allCompleteCycleToken

		const now = new Date()
		const delegation: DelegationRecord = {
			id: input.id,
			rootSessionID: input.rootSessionID,
			sessionID: input.sessionID,
			parentSessionID: input.parentSessionID,
			parentMessageID: input.parentMessageID,
			parentAgent: input.parentAgent,
			prompt: input.prompt,
			agent: input.agent,
			notificationCycle,
			notificationCycleToken,
			status: "registered",
			createdAt: now,
			updatedAt: now,
			timeoutAt: new Date(now.getTime() + this.maxRunTimeMs),
			progress: {
				toolCalls: 0,
				lastUpdateAt: now,
				lastHeartbeatAt: now,
			},
			notification: {
				terminalNotificationCount: 0,
			},
			retrieval: {
				retrievalCount: 0,
			},
			artifact: {
				filePath: input.artifactPath,
			},
		}

		this.delegations.set(delegation.id, delegation)
		this.delegationsBySession.set(delegation.sessionID, delegation.id)
		this.createTerminalWaiter(delegation.id)
		this.pendingByParent.get(delegation.parentSessionID)?.add(delegation.id)

		return delegation
	}

	private markStarted(id: string): DelegationRecord | undefined {
		return this.updateDelegation(id, (delegation, now) => {
			if (isTerminalStatus(delegation.status)) return
			delegation.status = "running"
			delegation.startedAt = now
			delegation.progress.lastUpdateAt = now
			delegation.progress.lastHeartbeatAt = now
		})
	}

	private markProgress(id: string, messageText?: string): DelegationRecord | undefined {
		return this.updateDelegation(id, (delegation, now) => {
			if (isTerminalStatus(delegation.status)) return
			if (delegation.status === "registered") {
				delegation.status = "running"
				delegation.startedAt = delegation.startedAt ?? now
			}

			delegation.progress.lastUpdateAt = now
			delegation.progress.lastHeartbeatAt = now

			if (messageText) {
				delegation.progress.lastMessage = messageText
				delegation.progress.lastMessageAt = now
			}
		})
	}

	private markTerminal(
		id: string,
		status: DelegationTerminalStatus,
		error?: string,
	): { transitioned: boolean; delegation?: DelegationRecord } {
		const delegation = this.delegations.get(id)
		if (!delegation) return { transitioned: false }

		if (isTerminalStatus(delegation.status)) {
			return { transitioned: false, delegation }
		}

		const now = new Date()
		delegation.status = status
		delegation.completedAt = now
		delegation.updatedAt = now
		if (error) {
			delegation.error = error
		}

		const pending = this.pendingByParent.get(delegation.parentSessionID)
		if (pending) {
			pending.delete(delegation.id)
			if (pending.size === 0) {
				this.pendingByParent.delete(delegation.parentSessionID)
			}
		}

		this.clearTimeoutTimer(id)
		this.resolveTerminalWaiter(id)

		return { transitioned: true, delegation }
	}

	private markNotified(id: string): DelegationRecord | undefined {
		return this.updateDelegation(id, (delegation, now) => {
			delegation.notification.terminalNotifiedAt = now
			delegation.notification.terminalNotificationCount += 1
		})
	}

	private getParentNotificationState(parentSessionID: string): ParentNotificationState {
		const existing = this.parentNotificationState.get(parentSessionID)
		if (existing) return existing

		const initialized: ParentNotificationState = {
			allCompleteNotificationCount: 0,
			allCompleteCycle: 0,
			allCompleteCycleToken: this.buildAllCompleteCycleToken(parentSessionID, 0),
		}
		this.parentNotificationState.set(parentSessionID, initialized)
		return initialized
	}

	private buildAllCompleteCycleToken(parentSessionID: string, cycle: number): string {
		return `${parentSessionID}:${cycle}`
	}

	private resetParentAllCompleteNotificationCycle(parentSessionID: string): void {
		const state = this.getParentNotificationState(parentSessionID)
		this.cancelScheduledAllComplete(state)
		state.allCompleteCycle += 1
		state.allCompleteCycleToken = this.buildAllCompleteCycleToken(
			parentSessionID,
			state.allCompleteCycle,
		)
		state.allCompleteNotifiedAt = undefined
		state.allCompleteNotifiedCycle = undefined
		state.allCompleteNotifiedCycleToken = undefined
	}

	private cancelScheduledAllComplete(state: ParentNotificationState): void {
		if (state.allCompleteScheduledTimer) {
			clearTimeout(state.allCompleteScheduledTimer)
		}
		state.allCompleteScheduledTimer = undefined
		state.allCompleteScheduledCycle = undefined
		state.allCompleteScheduledCycleToken = undefined
	}

	private areCycleTerminalNotificationsComplete(
		parentSessionID: string,
		cycleToken: string,
	): boolean {
		let cycleDelegationCount = 0

		for (const delegation of this.delegations.values()) {
			if (delegation.parentSessionID !== parentSessionID) continue
			if (delegation.notificationCycleToken !== cycleToken) continue

			cycleDelegationCount += 1
			if (!delegation.notification.terminalNotifiedAt) {
				return false
			}
		}

		return cycleDelegationCount > 0
	}

	private scheduleAllCompleteForParent(parentSessionID: string, parentAgent: string): void {
		const state = this.getParentNotificationState(parentSessionID)
		const cycle = state.allCompleteCycle
		const cycleToken = state.allCompleteCycleToken
		if (!this.areCycleTerminalNotificationsComplete(parentSessionID, cycleToken)) return

		if (state.allCompleteNotifiedCycleToken === cycleToken) return
		if (state.allCompleteScheduledCycleToken === cycleToken) return

		this.cancelScheduledAllComplete(state)

		state.allCompleteScheduledCycle = cycle
		state.allCompleteScheduledCycleToken = cycleToken
		state.allCompleteScheduledTimer = setTimeout(() => {
			void this.dispatchScheduledAllComplete(parentSessionID, parentAgent, cycle, cycleToken)
		}, this.allCompleteQuietPeriodMs)
	}

	private async dispatchScheduledAllComplete(
		parentSessionID: string,
		parentAgent: string,
		cycle: number,
		cycleToken: string,
	): Promise<void> {
		const state = this.getParentNotificationState(parentSessionID)

		if (state.allCompleteScheduledCycleToken !== cycleToken) return

		this.cancelScheduledAllComplete(state)

		if (state.allCompleteCycleToken !== cycleToken) return
		if (!this.areCycleTerminalNotificationsComplete(parentSessionID, cycleToken)) return
		if (state.allCompleteNotifiedCycleToken === cycleToken) return

		const deliveryStatus = await this.sendParentNotification(
			parentSessionID,
			parentAgent,
			this.buildAllCompleteNotification(parentSessionID, cycle, cycleToken),
			false,
		)

		if (state.allCompleteCycleToken !== cycleToken) return
		if (!this.areCycleTerminalNotificationsComplete(parentSessionID, cycleToken)) return

		state.allCompleteNotifiedAt = new Date()
		state.allCompleteNotificationCount += 1
		state.allCompleteNotifiedCycle = cycle
		state.allCompleteNotifiedCycleToken = cycleToken

		await this.debugLog(
			`all-complete notification ${deliveryStatus} for ${parentSessionID} cycle=${cycleToken}`,
		)
	}

	private queuePendingNotification(parentSessionID: string, notification: string): void {
		const pending = this.pendingNotifications.get(parentSessionID) ?? []
		pending.push(notification)
		this.pendingNotifications.set(parentSessionID, pending)
	}

	private async sendParentNotification(
		parentSessionID: string,
		parentAgent: string,
		notification: string,
		noReply: boolean,
	): Promise<"sent" | "queued" | "timed-out"> {
		const session = this.client.session
		let timeout: ReturnType<typeof setTimeout> | undefined

		try {
			await this.debugLog(
				`parent notification sending for ${parentSessionID} noReply=${noReply} kind=${
					noReply ? "synthetic" : "prompt"
				}`,
			)

			// V1 used session.promptAsync({ body: { noReply, agent, parts } }).
			// V2 port: noReply=false -> session.prompt (admits a user prompt);
			// noReply=true -> session.synthetic (records the message without
			// triggering a parent agent reply, preserving V1 noReply semantics).
			// TODO(port): V1 set the parent agent per prompt; V2 prompts have no
			// per-request agent override, so the session's own agent is used.
			void parentAgent
			const request = noReply
				? session.synthetic({ sessionID: parentSessionID, text: notification })
				: session.prompt({ sessionID: parentSessionID, text: notification })

			const result = await Promise.race<"sent" | "timed-out">([
				request.then(() => "sent" as const),
				new Promise<"timed-out">((resolve) => {
					timeout = setTimeout(() => resolve("timed-out"), PARENT_NOTIFICATION_TIMEOUT_MS)
				}),
			])

			if (result === "timed-out") {
				await this.debugLog(
					`parent notification timed out for ${parentSessionID} after ${PARENT_NOTIFICATION_TIMEOUT_MS}ms`,
				)
			}

			return result
		} catch (error) {
			this.queuePendingNotification(parentSessionID, notification)
			await this.debugLog(
				`parent notification queued for ${parentSessionID}: ${
					error instanceof Error ? error.message : "Unknown error"
				}`,
			)
			return "queued"
		} finally {
			if (timeout) clearTimeout(timeout)
		}
	}

	/**
	 * Deliver queued notifications on the next admitted user prompt.
	 *
	 * V2 port of `injectPendingNotificationsIntoChatMessage` (V1 mutated the
	 * `chat.message` hook's `output.parts`); the V2 session "prompt" hook
	 * exposes the admitted prompt draft, so the notification text is prepended
	 * to the prompt text.
	 */
	injectPendingNotificationsIntoPrompt(prompt: { text: string }, sessionID: string): void {
		const pending = this.pendingNotifications.get(sessionID)
		if (!pending || pending.length === 0) return

		this.pendingNotifications.delete(sessionID)
		const notificationText = pending.join("\n\n")
		prompt.text = `${notificationText}\n\n${prompt.text}`
	}

	private markRetrieved(id: string, readerSessionID: string): DelegationRecord | undefined {
		return this.updateDelegation(id, (delegation, now) => {
			delegation.retrieval.retrievedAt = now
			delegation.retrieval.retrievalCount += 1
			delegation.retrieval.lastReaderSessionID = readerSessionID
		})
	}

	private hasUnreadCompletion(delegation: DelegationRecord): boolean {
		if (!isTerminalStatus(delegation.status)) return false
		if (!delegation.notification.terminalNotifiedAt) return false
		if (!delegation.completedAt) return false

		if (!delegation.retrieval.retrievedAt) return true
		return delegation.retrieval.retrievedAt.getTime() < delegation.completedAt.getTime()
	}

	private async waitForTerminal(id: string, timeoutMs: number): Promise<"terminal" | "timeout"> {
		const delegation = this.delegations.get(id)
		if (!delegation) return "timeout"
		if (isTerminalStatus(delegation.status)) return "terminal"

		const waiter = this.terminalWaiters.get(id)
		if (!waiter) return "timeout"

		let timer: ReturnType<typeof setTimeout> | undefined
		try {
			const result = await Promise.race<"terminal" | "timeout">([
				waiter.promise.then(() => "terminal"),
				new Promise<"timeout">((resolve) => {
					timer = setTimeout(() => resolve("timeout"), timeoutMs)
				}),
			])
			return result
		} finally {
			if (timer) clearTimeout(timer)
		}
	}

	private async generateUniqueDelegationId(artifactDir: string): Promise<string> {
		for (let attempt = 0; attempt < 20; attempt++) {
			const candidate = this.idGenerator()
			if (this.delegations.has(candidate)) continue

			const candidatePath = path.join(artifactDir, `${candidate}.md`)
			try {
				await fs.access(candidatePath)
			} catch {
				return candidate
			}
		}

		throw new Error("Failed to generate unique delegation ID after 20 attempts")
	}

	private getDelegationBySession(sessionID: string): DelegationRecord | undefined {
		const delegationId = this.delegationsBySession.get(sessionID)
		if (!delegationId) return undefined
		return this.delegations.get(delegationId)
	}

	private isVisibleToSession(delegation: DelegationRecord, rootSessionID: string): boolean {
		return delegation.rootSessionID === rootSessionID
	}

	private buildTerminalNotification(delegation: DelegationRecord, remainingCount: number): string {
		const lines = [
			"<task-notification>",
			`<task-id>${delegation.id}</task-id>`,
			`<status>${delegation.status}</status>`,
			`<summary>Background agent ${delegation.status}: ${delegation.title || delegation.id}</summary>`,
			delegation.title ? `<title>${delegation.title}</title>` : "",
			delegation.description ? `<description>${delegation.description}</description>` : "",
			delegation.error ? `<error>${delegation.error}</error>` : "",
			`<artifact>${delegation.artifact.filePath}</artifact>`,
			`<retrieval>Use delegation_read("${delegation.id}") for full output.</retrieval>`,
			remainingCount > 0 ? `<remaining>${remainingCount}</remaining>` : "",
			"</task-notification>",
		]

		return lines.filter((line) => line.length > 0).join("\n")
	}

	private buildAllCompleteNotification(
		parentSessionID: string,
		cycle: number,
		cycleToken: string,
	): string {
		// cycle-token is a boundary watermark.
		// Receivers should ignore all-complete payloads whose token is older than
		// the latest known registration cycle for this parent session.
		return [
			"<task-notification>",
			"<type>all-complete</type>",
			"<status>completed</status>",
			"<summary>All delegations complete.</summary>",
			`<parent-session-id>${parentSessionID}</parent-session-id>`,
			`<cycle>${cycle}</cycle>`,
			`<cycle-token>${cycleToken}</cycle-token>`,
			"</task-notification>",
		].join("\n")
	}

	private buildDeterministicTerminalReadResponse(delegation: DelegationRecord): string {
		const lines = [
			`Delegation ID: ${delegation.id}`,
			`Status: ${delegation.status}`,
			`Agent: ${delegation.agent}`,
			`Started: ${delegation.startedAt?.toISOString() || delegation.createdAt.toISOString()}`,
			`Completed: ${delegation.completedAt?.toISOString() || "N/A"}`,
			`Artifact: ${delegation.artifact.filePath}`,
		]

		if (delegation.title) lines.push(`Title: ${delegation.title}`)
		if (delegation.description) lines.push(`Description: ${delegation.description}`)
		if (delegation.error) lines.push(`Error: ${delegation.error}`)

		lines.push(`\nUse delegation_read("${delegation.id}") again after persistence completes.`)
		return lines.join("\n")
	}

	private async readPersistedArtifact(filePath: string): Promise<string | null> {
		try {
			return await fs.readFile(filePath, "utf8")
		} catch {
			return null
		}
	}

	private async waitForPersistedArtifact(
		filePath: string,
		maxWaitMs: number,
	): Promise<string | null> {
		const start = Date.now()
		while (Date.now() - start < maxWaitMs) {
			const content = await this.readPersistedArtifact(filePath)
			if (content !== null) return content
			await new Promise((resolve) => setTimeout(resolve, this.readPollIntervalMs))
		}

		return null
	}

	private async resolveDelegationResult(delegation: DelegationRecord): Promise<string> {
		if (delegation.status === "error") {
			return `Error: ${delegation.error || "Delegation failed."}`
		}

		if (delegation.status === "cancelled") {
			return "Delegation was cancelled before completion."
		}

		if (delegation.status === "timeout") {
			const partial = await this.getResult(delegation)
			return `${partial}\n\n[TIMEOUT REACHED]`
		}

		return await this.getResult(delegation)
	}

	private async finalizeDelegation(
		delegationId: string,
		status: DelegationTerminalStatus,
		error?: string,
	): Promise<void> {
		const { transitioned, delegation } = this.markTerminal(delegationId, status, error)
		if (!transitioned || !delegation) return

		await this.debugLog(`finalizeDelegation(${delegation.id}, ${status}) started`)

		const resolvedResult = await this.resolveDelegationResult(delegation)
		delegation.result = resolvedResult

		if (resolvedResult.trim().length > 0) {
			const metadata = await this.metadataGenerator(
				this.client,
				resolvedResult,
				delegation.sessionID,
				(msg) => this.debugLog(msg),
			)
			delegation.title = metadata.title
			delegation.description = metadata.description
		}

		await this.persistOutput(delegation, resolvedResult)
		await this.notifyParent(delegation.id)
	}

	private async notifyParent(delegationId: string): Promise<void> {
		try {
			const delegation = this.delegations.get(delegationId)
			if (!delegation) return
			if (!isTerminalStatus(delegation.status)) return
			if (delegation.notification.terminalNotifiedAt) {
				await this.debugLog(`notifyParent skipped for ${delegation.id}; already notified`)
				return
			}

			const remainingCount = this.getPendingCount(delegation.parentSessionID)
			const terminalNotification = this.buildTerminalNotification(delegation, remainingCount)

			const deliveryStatus = await this.sendParentNotification(
				delegation.parentSessionID,
				delegation.parentAgent,
				terminalNotification,
				true,
			)

			this.markNotified(delegation.id)
			this.scheduleAllCompleteForParent(delegation.parentSessionID, delegation.parentAgent)

			await this.debugLog(
				`notifyParent ${deliveryStatus} for ${delegation.id} (remaining=${remainingCount}, status=${delegation.status})`,
			)
		} catch (error) {
			await this.debugLog(
				`notifyParent failed for ${delegationId}: ${error instanceof Error ? error.message : "Unknown error"}`,
			)
		}
	}

	/**
	 * Delegate a task to an agent
	 */
	async delegate(input: DelegateInput): Promise<DelegationRecord> {
		// Anti-recursion guard (V2 port): V1 disabled task/delegate/todowrite/
		// plan_save on delegation sessions via prompt-level `tools` overrides,
		// which V2 prompts no longer support. `delegate` recursion is blocked at
		// the source; see the TODO(port) note at the prompt call below.
		if (this.getDelegationBySession(input.parentSessionID)) {
			throw new Error(
				"Nested delegation is not supported: this session is itself a delegation.",
			)
		}

		// Validate agent exists before creating session
		const agentsResult = await this.client.agent.list()
		const agents = (agentsResult.data ?? []) as {
			name: string
			description?: string
			mode?: string
		}[]
		const validAgent = agents.find((a) => a.name === input.agent)

		if (!validAgent) {
			const available = agents
				.filter((a) => a.mode === "subagent" || a.mode === "all" || !a.mode)
				.map((a) => `• ${a.name}${a.description ? ` - ${a.description}` : ""}`)
				.join("\n")

			throw new Error(
				`Agent "${input.agent}" not found.\n\nAvailable agents:\n${available || "(none)"}`,
			)
		}

		// Check if agent is read-only (Early Exit + Fail Fast)
		const { isReadOnly } = await parseAgentWriteCapability(this.client, input.agent, this.log)
		if (!isReadOnly) {
			throw new Error(
				`Agent "${input.agent}" is write-capable and requires the native \`task\` tool for proper undo/branching support.\n\n` +
					`Use \`task\` instead of \`delegate\` for write-capable agents.\n\n` +
					`Read-only sub-agents (edit/write/bash denied) use \`delegate\`.\n` +
					`Write-capable sub-agents (any write permission) use \`task\`.`,
			)
		}

		const artifactDir = await this.ensureDelegationsDir(input.parentSessionID)
		const rootSessionID = await this.getRootSessionID(input.parentSessionID)
		const stableId = await this.generateUniqueDelegationId(artifactDir)
		const artifactPath = path.join(artifactDir, `${stableId}.md`)

		await this.debugLog(`delegate() called, generated stable ID: ${stableId}`)

		// Create isolated session for delegation.
		// The agent is bound at creation time - V2 prompts have no per-request
		// agent override, so this preserves the V1 "Agent param is critical for
		// MCP tools" behaviour.
		// TODO(port): V1 also linked the child session via `parentID`; V2 session
		// creation no longer accepts a parentID (the plugin tracks the parent in
		// DelegationRecord instead).
		const sessionResult = await this.client.session.create({
			title: `Delegation: ${stableId}`,
			agent: input.agent,
		})

		await this.debugLog(`session.create result: ${JSON.stringify(sessionResult)}`)

		if (!sessionResult?.id) {
			throw new Error("Failed to create delegation session")
		}

		const delegation = this.registerDelegation({
			id: stableId,
			rootSessionID,
			sessionID: sessionResult.id,
			parentSessionID: input.parentSessionID,
			parentMessageID: input.parentMessageID,
			parentAgent: input.parentAgent,
			prompt: input.prompt,
			agent: input.agent,
			artifactPath,
		})

		await this.debugLog(`Registered delegation ${delegation.id} before execution`)
		this.scheduleTimeout(delegation.id)
		this.markStarted(delegation.id)

		// Fire the prompt. V1 awaited client.session.prompt(...) resolution to
		// detect agent-loop completion; V2 session.prompt returns after durable
		// admission, so completion is awaited with session.wait(...) and is also
		// observed via the session.idle event (whichever fires first wins, since
		// finalizeDelegation is idempotent).
		// TODO(port): V1 disabled task/delegate/todowrite/plan_save on this prompt
		// via body.tools; V2 prompts expose no per-request tool overrides, so only
		// the delegate guard above is enforced.
		this.client.session
			.prompt({ sessionID: delegation.sessionID, text: input.prompt })
			.then(() => this.client.session.wait({ sessionID: delegation.sessionID }))
			.then(() => {
				void this.finalizeDelegation(delegation.id, "complete")
			})
			.catch((error: Error) => {
				void this.finalizeDelegation(delegation.id, "error", error.message)
			})

		return delegation
	}

	/**
	 * Handle delegation timeout
	 */
	private async handleTimeout(delegationId: string): Promise<void> {
		const delegation = this.delegations.get(delegationId)
		if (!delegation || isTerminalStatus(delegation.status)) return

		await this.debugLog(`handleTimeout for delegation ${delegation.id}`)

		// Try to cancel the session.
		// TODO(port): V1 removed the child session (client.session.delete); the V2
		// plugin session domain exposes no remove/delete, so the running session
		// is interrupted instead (continue: false prevents auto-continuation).
		try {
			await this.client.session.interrupt({ sessionID: delegation.sessionID, resume: false })
		} catch {
			// Ignore
		}

		await this.finalizeDelegation(
			delegation.id,
			"timeout",
			`Delegation timed out after ${this.maxRunTimeMs / 1000}s`,
		)
	}

	/**
	 * Handle session.idle event - called when a session becomes idle
	 */
	async handleSessionIdle(sessionID: string): Promise<void> {
		const delegation = this.findBySession(sessionID)
		if (!delegation || isTerminalStatus(delegation.status)) return

		await this.debugLog(`handleSessionIdle for delegation ${delegation.id}`)
		await this.finalizeDelegation(delegation.id, "complete")
	}

	/**
	 * Get the result from a delegation's session
	 */
	private async getResult(delegation: DelegationRecord): Promise<string> {
		try {
			// V2 port: client.session.messages({ path }) -> ctx.session.context,
			// which returns a flat list of message objects (assistant text lives
			// in `content` instead of a separate parts array).
			const messageData = (await this.client.session.context({
				sessionID: delegation.sessionID,
			})) as readonly V2SessionMessage[]

			if (!messageData || messageData.length === 0) {
				await this.debugLog(`getResult: No messages found for session ${delegation.sessionID}`)
				return `Delegation "${delegation.description}" completed but produced no output.`
			}

			await this.debugLog(
				`getResult: Found ${messageData.length} messages. Types: ${messageData.map((m) => m.type).join(", ")}`,
			)

			// Find the last message from the assistant/model
			const isAssistantMessage = (m: V2SessionMessage): m is V2AssistantMessage =>
				m.type === "assistant"

			const assistantMessages = messageData.filter(isAssistantMessage)

			if (assistantMessages.length === 0) {
				await this.debugLog(
					`getResult: No assistant messages found in ${JSON.stringify(messageData.map((m) => ({ type: m.type })))}`,
				)
				return `Delegation "${delegation.description}" completed but produced no assistant response.`
			}

			const lastMessage = assistantMessages[assistantMessages.length - 1]

			// Extract text parts from the message
			const textParts = lastMessage.content.filter(
				(part) => part.type === "text" && typeof part.text === "string",
			)

			if (textParts.length === 0) {
				await this.debugLog(
					`getResult: No text parts found in message: ${JSON.stringify(lastMessage)}`,
				)
				return `Delegation "${delegation.description}" completed but produced no text content.`
			}

			return textParts
				.map((part) => part.text as string)
				.join("\n")
		} catch (error) {
			await this.debugLog(
				`getResult error: ${error instanceof Error ? error.message : "Unknown error"}`,
			)
			return `Delegation "${delegation.description}" completed but result could not be retrieved: ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		}
	}

	/**
	 * Persist delegation output to storage
	 */
	private async persistOutput(delegation: DelegationRecord, content: string): Promise<void> {
		try {
			// Use title/description if available (generated by small model), otherwise fallback
			const title = delegation.title || delegation.id
			const description = delegation.description || "(No description generated)"

			const header = `# ${title}

${description}

**ID:** ${delegation.id}
**Agent:** ${delegation.agent}
**Status:** ${delegation.status}
**Session:** ${delegation.sessionID}
**Started:** ${(delegation.startedAt || delegation.createdAt).toISOString()}
**Completed:** ${delegation.completedAt?.toISOString() || "N/A"}

---

`
			await fs.writeFile(delegation.artifact.filePath, header + content, "utf8")

			const stats = await fs.stat(delegation.artifact.filePath)
			this.updateDelegation(delegation.id, (record, now) => {
				record.artifact.persistedAt = now
				record.artifact.byteLength = stats.size
				record.artifact.persistError = undefined
			})

			await this.debugLog(`Persisted output to ${delegation.artifact.filePath}`)
		} catch (error) {
			this.updateDelegation(delegation.id, (record) => {
				record.artifact.persistError =
					error instanceof Error ? error.message : "Unknown persistence error"
			})
			await this.debugLog(
				`Failed to persist output: ${error instanceof Error ? error.message : "Unknown error"}`,
			)
		}
	}

	/**
	 * Read a delegation's output by ID. Blocks if the delegation is still running.
	 */
	async readOutput(sessionID: string, id: string): Promise<string> {
		const normalizedId = normalizeId(id)
		if (!normalizedId) {
			throw new Error("Delegation ID is required")
		}

		const rootSessionID = await this.getRootSessionID(sessionID)
		let delegation = this.delegations.get(normalizedId)
		if (delegation && !this.isVisibleToSession(delegation, rootSessionID)) {
			delegation = undefined
		}

		const fallbackFilePath = path.join(
			await this.getDelegationsDir(sessionID),
			`${normalizedId}.md`,
		)

		const immediateArtifactPath = delegation?.artifact.filePath || fallbackFilePath
		const immediateRead = await this.readPersistedArtifact(immediateArtifactPath)
		if (immediateRead !== null) {
			if (delegation) this.markRetrieved(delegation.id, sessionID)
			return immediateRead
		}

		if (!delegation) {
			throw new Error(
				`Delegation "${normalizedId}" not found.\n\nUse delegation_list() to see available delegations.`,
			)
		}

		if (isActiveStatus(delegation.status)) {
			const remainingMs = Math.max(
				delegation.timeoutAt.getTime() - Date.now() + this.terminalWaitGraceMs,
				this.readPollIntervalMs,
			)

			await this.debugLog(
				`readOutput: waiting up to ${remainingMs}ms for delegation ${delegation.id} to reach terminal state`,
			)

			const waitResult = await this.waitForTerminal(delegation.id, remainingMs)
			if (waitResult === "timeout" && isActiveStatus(delegation.status)) {
				await this.handleTimeout(delegation.id)
			}
		}

		if (isTerminalStatus(delegation.status)) {
			const delayedPersisted = await this.waitForPersistedArtifact(
				delegation.artifact.filePath,
				Math.max(this.readPollIntervalMs * 8, 500),
			)
			if (delayedPersisted !== null) {
				this.markRetrieved(delegation.id, sessionID)
				return delayedPersisted
			}
		}

		const persisted = await this.readPersistedArtifact(delegation.artifact.filePath)
		if (persisted !== null) {
			this.markRetrieved(delegation.id, sessionID)
			return persisted
		}

		if (isTerminalStatus(delegation.status)) {
			return this.buildDeterministicTerminalReadResponse(delegation)
		}

		return `Delegation "${delegation.id}" is still running. You will receive a <task-notification> when it reaches a terminal state.`
	}

	/**
	 * List all delegations for a session
	 */
	async listDelegations(sessionID: string): Promise<DelegationListItem[]> {
		const rootSessionID = await this.getRootSessionID(sessionID)
		const results: DelegationListItem[] = []

		// Add in-memory delegations in this root session scope
		for (const delegation of this.delegations.values()) {
			if (!this.isVisibleToSession(delegation, rootSessionID)) continue

			results.push({
				id: delegation.id,
				status: delegation.status,
				title: delegation.title || delegation.id,
				description:
					delegation.description ||
					(delegation.status === "running" || delegation.status === "registered"
						? "(running)"
						: "(no description)"),
				agent: delegation.agent,
				unread: this.hasUnreadCompletion(delegation),
			})
		}

		// Check filesystem for persisted delegations
		try {
			const dir = await this.getDelegationsDir(rootSessionID)
			const files = await fs.readdir(dir)

			for (const file of files) {
				if (file.endsWith(".md")) {
					const id = file.replace(".md", "")
					// Deduplicate: prioritize in-memory status
					if (!results.find((r) => r.id === id)) {
						// Try to read title, agent, description from file
						let title = "(loaded from storage)"
						let description = ""
						let agent: string | undefined
						let status: DelegationStatus = "complete"
						try {
							const filePath = path.join(dir, file)
							const content = await fs.readFile(filePath, "utf8")
							const titleMatch = content.match(/^# (.+)$/m)
							if (titleMatch) title = titleMatch[1]
							const agentMatch = content.match(/^\*\*Agent:\*\* (.+)$/m)
							if (agentMatch) agent = agentMatch[1]
							const statusMatch = content.match(/^\*\*Status:\*\* (.+)$/m)
							status = parsePersistedStatus(statusMatch?.[1]?.trim())
							// Get first paragraph after title as description
							const lines = content.split("\n")
							if (lines.length > 2 && lines[2]) {
								description = lines[2].slice(0, 150)
							}
						} catch {
							// Ignore read errors
						}
						results.push({
							id,
							status,
							title,
							description,
							agent,
							unread: false,
						})
					}
				}
			}
		} catch {
			// Directory may not exist yet
		}

		results.sort((a, b) => a.id.localeCompare(b.id))
		return results
	}

	/**
	 * Delete a delegation by id (cancels if running, removes from storage)
	 * Used internally for cleanup (timeout, etc.)
	 */
	async deleteDelegation(sessionID: string, id: string): Promise<boolean> {
		const normalizedId = normalizeId(id)
		const delegation = this.delegations.get(normalizedId)

		if (delegation) {
			if (isActiveStatus(delegation.status)) {
				// TODO(port): V1 removed the session (client.session.delete); the V2
				// plugin session domain exposes no remove/delete, so it is interrupted.
				try {
					await this.client.session.interrupt({ sessionID: delegation.sessionID, resume: false })
				} catch {
					// Session may already be interrupted
				}
				this.markTerminal(delegation.id, "cancelled", "Delegation deleted by cleanup")
			}

			this.clearTimeoutTimer(delegation.id)
			this.terminalWaiters.delete(delegation.id)
			this.delegationsBySession.delete(delegation.sessionID)
			this.delegations.delete(delegation.id)
		}

		// Remove from filesystem
		try {
			const dir = await this.getDelegationsDir(sessionID)
			const filePath = path.join(dir, `${normalizedId}.md`)
			await fs.unlink(filePath)
			return true
		} catch {
			return false
		}
	}

	/**
	 * Find a delegation by its session ID
	 */
	findBySession(sessionID: string): DelegationRecord | undefined {
		return this.getDelegationBySession(sessionID)
	}

	/**
	 * Handle message events for progress tracking
	 */
	handleMessageEvent(sessionID: string, messageText?: string): void {
		const delegation = this.findBySession(sessionID)
		if (!delegation) return
		this.markProgress(delegation.id, messageText)
	}

	/**
	 * Get count of pending delegations for a parent session
	 */
	getPendingCount(parentSessionID: string): number {
		const pendingSet = this.pendingByParent.get(parentSessionID)
		if (!pendingSet) return 0
		return Array.from(pendingSet).filter((id) => {
			const delegation = this.delegations.get(id)
			return delegation ? isActiveStatus(delegation.status) : false
		}).length
	}

	/**
	 * Get all currently running delegations (in-memory only)
	 */
	getRunningDelegations(rootSessionID?: string): DelegationRecord[] {
		return Array.from(this.delegations.values()).filter((delegation) => {
			if (rootSessionID && delegation.rootSessionID !== rootSessionID) return false
			return isActiveStatus(delegation.status)
		})
	}

	getUnreadCompletedDelegations(rootSessionID: string, limit = 10): DelegationRecord[] {
		return Array.from(this.delegations.values())
			.filter((delegation) => delegation.rootSessionID === rootSessionID)
			.filter((delegation) => this.hasUnreadCompletion(delegation))
			.sort((a, b) => {
				const aTime = a.completedAt?.getTime() || 0
				const bTime = b.completedAt?.getTime() || 0
				return bTime - aTime
			})
			.slice(0, limit)
	}

	/**
	 * Get recent completed delegations for compaction injection
	 */
	async getRecentCompletedDelegations(
		sessionID: string,
		limit: number = 10,
	): Promise<DelegationListItem[]> {
		const all = await this.listDelegations(sessionID)
		return all.filter((d) => isTerminalStatus(d.status)).slice(-limit)
	}

	/**
	 * Log debug messages
	 */
	async debugLog(msg: string): Promise<void> {
		// Only log if debug is enabled (could be env var or static const)
		// For now, mirroring previous behavior but writing to the new baseDir/debug.log
		const timestamp = new Date().toISOString()
		const line = `${timestamp}: ${msg}\n`
		const debugFile = path.join(this.baseDir, "background-agents-debug.log")

		try {
			await fs.appendFile(debugFile, line, "utf8")
		} catch {
			// Ignore errors, try to ensure dir once if it fails?
			// Simpler to just ignore for debug logs
		}
	}
}

// ==========================================
// TOOL CREATORS
// ==========================================

interface DelegateArgs {
	prompt: string
	agent: string
}

/**
 * V2 tool execution context subset used by the delegation tools.
 * (V2 ToolContext carries readonly sessionID/agent/messageID plus progress().)
 */
interface DelegationToolContext {
	readonly sessionID?: string
	readonly messageID?: string
	readonly agent?: string
}

/**
 * V2 port of the V1 `tool()` helper: tools are plain definitions registered
 * through `ctx.tool.transform(editor => editor.add(...))`, args use JSON
 * Schema, and string results are returned as `{ content }`.
 */
interface DelegationToolDefinition {
	name: "delegate" | "delegation_read" | "delegation_list"
	description: string
	input: Record<string, unknown>
	execute: (input: unknown, toolCtx: unknown) => Promise<{ content: string }>
}

function createDelegate(manager: DelegationManager): DelegationToolDefinition {
	return {
		name: "delegate",
		description: `Delegate a task to an agent. Returns immediately with a readable ID.

Use this for:
- Research tasks (will be auto-saved)
- Parallel work that can run in background
- Any task where you want persistent, retrievable output

On completion, a notification will arrive with the ID and terminal summary.
Use \`delegation_read\` with the ID to retrieve full persisted output (including after compaction).`,
		input: {
			type: "object",
			properties: {
				prompt: {
					type: "string",
					description: "The full detailed prompt for the agent. Must be in English.",
				},
				agent: {
					type: "string",
					description:
						'Agent to delegate to. Must be a read-only sub-agent (edit/write/bash denied), such as "researcher" or "explore".',
				},
			},
			required: ["prompt", "agent"],
			additionalProperties: false,
		},
		async execute(rawInput, rawToolCtx) {
			const args = rawInput as DelegateArgs
			const toolCtx = rawToolCtx as DelegationToolContext

			if (!toolCtx?.sessionID) {
				return { content: "❌ delegate requires sessionID. This is a system error." }
			}
			if (!toolCtx?.messageID) {
				return { content: "❌ delegate requires messageID. This is a system error." }
			}

			try {
				const delegation = await manager.delegate({
					parentSessionID: toolCtx.sessionID,
					parentMessageID: toolCtx.messageID,
					parentAgent: toolCtx.agent ?? "",
					prompt: args.prompt,
					agent: args.agent,
				})

				// Get total active count for this parent session
				const pendingSet = manager.getPendingCount(toolCtx.sessionID)
				const totalActive = pendingSet

				let response = `Delegation started: ${delegation.id}\nAgent: ${args.agent}`
				if (totalActive > 1) {
					response += `\n\n${totalActive} delegations now active.`
				}
				response += `\nYou WILL be notified when ${totalActive > 1 ? "ALL complete" : "complete"}. Do NOT poll.`

				return { content: response }
			} catch (error) {
				// Return validation errors as guidance, not exceptions
				return {
					content: `❌ Delegation failed:\n\n${error instanceof Error ? error.message : "Unknown error"}`,
				}
			}
		},
	}
}

function createDelegationRead(manager: DelegationManager): DelegationToolDefinition {
	return {
		name: "delegation_read",
		description: `Read the output of a delegation by its ID.
Use this to retrieve results from delegated tasks if the inline notification was lost during compaction.`,
		input: {
			type: "object",
			properties: {
				id: { type: "string", description: "The delegation ID (e.g., 'elegant-blue-tiger')" },
			},
			required: ["id"],
			additionalProperties: false,
		},
		async execute(rawInput, rawToolCtx) {
			const args = rawInput as { id: string }
			const toolCtx = rawToolCtx as DelegationToolContext

			if (!toolCtx?.sessionID) {
				return { content: "❌ delegation_read requires sessionID. This is a system error." }
			}

			return { content: await manager.readOutput(toolCtx.sessionID, args.id) }
		},
	}
}

function createDelegationList(manager: DelegationManager): DelegationToolDefinition {
	return {
		name: "delegation_list",
		description: `List all delegations for the current session.
Shows both running and completed delegations.`,
		input: {
			type: "object",
			properties: {},
			additionalProperties: false,
		},
		async execute(_rawInput, rawToolCtx) {
			const toolCtx = rawToolCtx as DelegationToolContext

			if (!toolCtx?.sessionID) {
				return { content: "❌ delegation_list requires sessionID. This is a system error." }
			}

			const delegations = await manager.listDelegations(toolCtx.sessionID)

			if (delegations.length === 0) {
				return { content: "No delegations found for this session." }
			}

			const lines = delegations.map((d) => {
				const titlePart = d.title ? ` | ${d.title}` : ""
				const unreadPart = d.unread ? " [unread]" : ""
				const descPart = d.description ? `\n  → ${d.description}` : ""
				return `- **${d.id}**${titlePart} [${d.status}]${unreadPart}${descPart}`
			})

			return { content: `## Delegations\n\n${lines.join("\n")}` }
		},
	}
}

// ==========================================
// DELEGATION RULES (injected into system prompt)
// ==========================================

const DELEGATION_RULES = `<task-notification>
<delegation-system>

## Async Delegation

You have tools for parallel background work:
- \`delegate(prompt, agent)\` - Launch task, returns ID immediately
- \`delegation_read(id)\` - Retrieve completed result
- \`delegation_list()\` - List delegations (use sparingly)

## Delegation Routing

Agents route based on their permissions:

| Agent Type | Tool | Why |
|------------|------|-----|
| Read-only sub-agents (edit/write/bash denied) | \`delegate\` | Background session, async |
| Write-capable sub-agents (any write permission) | \`task\` | Native task, preserves undo/branching |

**Read-only sub-agents** have edit="deny", write="deny", bash={"*":"deny"}.
**Write-capable sub-agents** have any write tool enabled.

## How It Works

1. For read-only sub-agents: Call \`delegate\` with detailed prompt
2. For write-capable sub-agents: Call \`task\` with detailed prompt
3. Continue productive work while it runs
4. Receive notification when complete
5. Call \`delegation_read(id)\` to retrieve results

## Critical Constraints

**NEVER poll \`delegation_list\` to check completion.**
You WILL be notified via \`<task-notification>\`. Polling wastes tokens.

**NEVER wait idle.** Always have productive work while delegations run.

**Using wrong tool will fail fast with guidance.**

</delegation-system>
</task-notification>`

// ==========================================
// COMPACTION CONTEXT FORMATTING
// ==========================================

interface DelegationForContext {
	id: string
	agent?: string
	title?: string
	description?: string
	status: DelegationStatus
	startedAt?: Date
	completedAt?: Date
	lastHeartbeatAt?: Date
	prompt?: string
}

/**
 * Format delegation context for injection during compaction.
 * Includes running delegations with notification reminder (only when running exist),
 * and recent completed delegations with full descriptions.
 */
function formatDelegationContext(
	running: DelegationForContext[],
	unreadCompleted: DelegationForContext[],
): string {
	const sections: string[] = ["<delegation-context>"]

	// Running delegations (if any)
	if (running.length > 0) {
		sections.push("## Running Delegations")
		sections.push("")
		for (const d of running) {
			sections.push(`### \`${d.id}\`${d.agent ? ` (${d.agent})` : ""}`)
			if (d.startedAt) {
				sections.push(`**Started:** ${d.startedAt.toISOString()}`)
			}
			if (d.lastHeartbeatAt) {
				sections.push(`**Last heartbeat:** ${d.lastHeartbeatAt.toISOString()}`)
			}
			if (d.prompt) {
				const truncatedPrompt = d.prompt.length > 200 ? `${d.prompt.slice(0, 200)}...` : d.prompt
				sections.push(`**Prompt:** ${truncatedPrompt}`)
			}
			sections.push("")
		}

		// Only include reminder when there ARE running delegations
		sections.push(
			"> **Note:** You WILL be notified via `<task-notification>` when delegations complete.",
		)
		sections.push("> Do NOT poll `delegation_list` - continue productive work.")
		sections.push("")
	}

	// Unread completed delegations (recent)
	if (unreadCompleted.length > 0) {
		sections.push("## Unread Completed Delegations")
		sections.push("")
		for (const d of unreadCompleted) {
			const statusEmoji =
				d.status === "complete"
					? "✅"
					: d.status === "error"
						? "❌"
						: d.status === "timeout"
							? "⏱️"
							: "🚫"
			sections.push(`### ${statusEmoji} \`${d.id}\``)
			sections.push(`**Title:** ${d.title || "(no title)"}`)
			sections.push(`**Status:** ${d.status}`)
			sections.push(`**Description:** ${d.description || "(no description)"}`)
			if (d.completedAt) {
				sections.push(`**Completed:** ${d.completedAt.toISOString()}`)
			}
			sections.push(`**Retrieve:** \`delegation_read("${d.id}")\``)
			sections.push("")
		}
		sections.push("> These are unread terminal delegations carried forward through compaction.")
		sections.push("")
	}

	sections.push("## Retrieval")
	sections.push('Use `delegation_read("id")` to access full delegation output.')
	sections.push("Do not poll delegation_list for completion; rely on task notifications.")
	sections.push("</delegation-context>")

	return sections.join("\n")
}

// ==========================================
// PLUGIN EXPORT
// ==========================================

export default Plugin.define({
	id: "kdco.background-agents",
	async setup(ctx) {
		// V2 port: V1 input.client / input.directory -> the plugin context
		const client: OpencodeClient = ctx
		const directory = ctx.location.directory

		// Create logger early for all components
		const log = createLogger(client)

		// Project-level storage directory (shared across sessions)
		// Uses git root commit hash for cross-worktree consistency
		const projectId = await getProjectId(directory)
		const baseDir = path.join(os.homedir(), ".local", "share", "opencode", "delegations", projectId)

		// Ensure base directory exists (for debug logs etc)
		await fs.mkdir(baseDir, { recursive: true })

		const manager = new DelegationManager(client, baseDir, log)

		await manager.debugLog("BackgroundAgentsPlugin initialized with delegation system")

		// V1 `tool` map -> V2 ctx.tool.transform editor registrations.
		await ctx.tool.transform((editor) => {
			editor.add(createDelegate(manager))
			editor.add(createDelegationRead(manager))
			editor.add(createDelegationList(manager))
		})

		// Prevent read-only agents from using native task tool (symmetric to delegate enforcement)
		// V1 "tool.execute.before" -> V2 ctx.tool.hook("execute.before");
		// V1 input.callID -> event.id, V1 output.args -> event.input.
		await ctx.tool.hook("execute.before", async (event) => {
			// Guard: Only intercept task tool
			if (event.tool !== "task") return

			// Guard: Require agent name
			const args = event.input as { subagent_type?: string } | undefined
			const agentName = args?.subagent_type
			if (!agentName) return

			// Parse boundary 1: Check agent mode
			const { isSubAgent } = await parseAgentMode(client, agentName, log)

			// Guard: Allow non-sub-agents (main/built-in)
			if (!isSubAgent) return

			// Parse boundary 2: Check write capability (only for sub-agents)
			const { isReadOnly } = await parseAgentWriteCapability(client, agentName, log)

			// Guard: Allow write-capable agents
			if (!isReadOnly) return

			// Fail fast: Read-only sub-agent via task is invalid
			throw new Error(
				`❌ Agent '${agentName}' is read-only and should use the delegate tool for async background execution.\n\n` +
					`Read-only agents have: edit="deny", write="deny", bash={"*":"deny"}\n` +
					`Use delegate for read-only sub-agents.\n` +
					`Use task for write-capable sub-agents.`,
			)
		})

		// Inject delegation rules into system prompt
		// V1 "experimental.chat.system.transform" -> V2 ctx.session.hook("context").
		await ctx.session.hook("context", (event) => {
			event.system.push({ type: "text", text: DELEGATION_RULES })
		})

		// Deliver queued parent notifications on the next user turn if direct delivery failed.
		// V1 "chat.message" -> V2 ctx.session.hook("prompt").
		await ctx.session.hook("prompt", (event) => {
			manager.injectPendingNotificationsIntoPrompt(event.prompt, event.sessionID)
		})

		// Compaction hook - inject delegation context for context recovery
		// V1 "experimental.session.compacting" (output.context strings appended to
		// the compaction prompt) -> V2 ctx.session.hook("compaction"); the same
		// context is pushed as a system part of the compaction request.
		await ctx.session.hook("compaction", async (event) => {
			const rootSessionID = await manager.getRootSessionID(event.sessionID)

			// Running delegations in this root session tree
			const running = manager.getRunningDelegations(rootSessionID).map((d) => ({
				id: d.id,
				agent: d.agent,
				title: d.title,
				description: d.description,
				status: d.status,
				startedAt: d.startedAt,
				lastHeartbeatAt: d.progress.lastHeartbeatAt,
				prompt: d.prompt,
			}))

			// Unread completed delegations to carry forward through compaction
			const unreadCompleted = manager.getUnreadCompletedDelegations(rootSessionID, 10).map((d) => ({
				id: d.id,
				agent: d.agent,
				title: d.title,
				description: d.description,
				status: d.status,
				completedAt: d.completedAt,
			}))

			// Early exit if nothing to inject
			if (running.length === 0 && unreadCompleted.length === 0) return

			event.system.push({
				type: "text",
				text: formatDelegationContext(running, unreadCompleted),
			})
		})

		// V1 `event` hook -> V2 ctx.event.subscribe() over the server event stream.
		// V2 events carry their payload in `data` (V1 used `properties`).
		const controller = new AbortController()
		void (async () => {
			for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
				if (event.type === "session.status") {
					const data = event.data as { sessionID?: string; status?: { type?: string } }
					const statusType = data.status?.type
					const sessionID = data.sessionID
					if (statusType === "idle" && sessionID) {
						await manager.handleSessionIdle(sessionID)
					}
				}

				if (event.type === "session.idle") {
					const data = event.data as { sessionID?: string }
					const sessionID = data.sessionID
					if (sessionID) {
						await manager.handleSessionIdle(sessionID)
					}
				}

				if (event.type === "session.text.ended") {
					// TODO(port): V1 tracked progress via "message.updated" (full assistant
					// message + parts); V2 removed that event. "session.text.ended" is the
					// closest stream event carrying completed assistant text.
					const data = event.data as { sessionID?: string; text?: string }
					const sessionID = data.sessionID
					if (sessionID) {
						const messageText = data.text || undefined
						manager.handleMessageEvent(sessionID, messageText)
					}
				}
			}
		})().catch((error: unknown) => {
			console.error(
				`[background-agents] event subscription failed: ${error instanceof Error ? error.message : String(error)}`,
			)
		})

		// Cleanup: abort the event stream when the plugin unloads.
		return () => {
			controller.abort()
		}
	},
})

/**
 * V2 port note: V1 attached `testInternals` to the exported plugin function
 * (`Object.assign(BackgroundAgentsPlugin, { testInternals })`). V2 requires
 * the default export to be a `Plugin.define` definition, so the test internals
 * are now a named export.
 */
export const testInternals = {
	DelegationManager,
	formatDelegationContext,
} as const
