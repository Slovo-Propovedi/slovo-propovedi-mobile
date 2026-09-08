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

/**
 * Sleeps for `ms`, resolving early when `signal` aborts (does NOT reject — the
 * single throw point for cancellation stays with the caller's `throwIfCancelled`).
 * No signal → plain sleep. Already-aborted → resolves immediately.
 * @param ms - Delay in milliseconds.
 * @param signal - Optional signal that shortens the sleep on abort.
 */
export const sleepAbortable = (ms: number, signal?: AbortSignal): Promise<void> => {
  if (signal?.aborted) return Promise.resolve()
  if (!signal) return new Promise(resolve => setTimeout(resolve, ms))

  return new Promise(resolve => {
    const onAbort = () => {
      clearTimeout(timer)
      resolve()
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    signal.addEventListener('abort', onAbort, { once: true })
  })
}
