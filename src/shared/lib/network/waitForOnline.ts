import NetInfo from '@react-native-community/netinfo'

const POLL_INTERVAL_MS = 1000

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Waits until the device reports connectivity, polling NetInfo every second.
 * Does an immediate first check (no initial delay).
 * Resolves `true` as soon as the device is online, or `false` if `timeoutMs`
 * elapses while still offline. Total sleeping never exceeds `timeoutMs`.
 * When an AbortSignal is provided, the loop checks it each tick and returns
 * early (false) on abort — callers must check `signal.aborted` themselves.
 * @param timeoutMs - Maximum time to wait for connectivity, in milliseconds.
 * @param signal - Optional signal that aborts the wait early.
 * @returns True if the device is online, false if the timeout elapsed offline
 * or the signal aborted.
 */
export const waitForOnline = async (timeoutMs: number, signal?: AbortSignal): Promise<boolean> => {
  let waitedMs = 0
  while (true) {
    if (signal?.aborted) return false
    const state = await NetInfo.fetch()
    if (state.isConnected) return true
    if (waitedMs >= timeoutMs) return false
    await sleep(POLL_INTERVAL_MS)
    waitedMs += POLL_INTERVAL_MS
  }
}
