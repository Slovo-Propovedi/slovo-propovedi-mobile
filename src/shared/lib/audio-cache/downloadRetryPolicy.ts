/** Total download attempts per track: 1 initial + 2 retries. */
export const MAX_DOWNLOAD_ATTEMPTS = 3

/** Delay before retry attempt 2 and 3. */
export const RETRY_BACKOFF_DELAYS_MS = [1000, 5000]

/** Abort the attempt when no progress bytes arrive for this long (stall guard). */
export const DOWNLOAD_STALL_TIMEOUT_MS = 30_000

/** How often the stall watcher checks for progress inactivity. */
export const STALL_CHECK_INTERVAL_MS = 5_000

/** Bounded wait for connectivity to return before each retry. */
export const WAIT_ONLINE_BEFORE_RETRY_MS = 60_000

export const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))
