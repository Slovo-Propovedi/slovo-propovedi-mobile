/**
 * Warning logger for kdco registry plugins.
 *
 * Provides a unified interface for logging warnings that works with
 * both the OpenCode client (when available) and console fallback.
 *
 * @module kdco-primitives/log-warn
 */

import type { OpencodeClient } from "./types"

/**
 * Log a warning message.
 *
 * TODO(port): The V1 implementation forwarded warnings to `client.app.log`,
 * which integrated with the OpenCode UI log panel. The V2 plugin context has
 * no logging domain (`ctx.app` is only `{ name, version, channel }`), so the
 * console fallback is now the only path. The `client` parameter is retained
 * for call-site compatibility and ignored.
 *
 * @param client - Unused since the V2 port (V1 OpenCode client / V2 plugin context)
 * @param service - Service name for log categorization (e.g., "worktree", "delegation")
 * @param message - Warning message to log
 *
 * @example
 * ```ts
 * logWarn(ctx, "delegation", "Task timed out after 30s")
 * // -> "[delegation] Task timed out after 30s" on console.warn
 * ```
 */
export function logWarn(
	_client: OpencodeClient | undefined,
	service: string,
	message: string,
): void {
	// Console fallback: server-side console output lands in the OpenCode log file.
	console.warn(`[${service}] ${message}`)
}
