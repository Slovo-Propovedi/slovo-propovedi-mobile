// Heartbeat cadence for keeping a live download's `lastSeenAt` fresh.
export const HEARTBEAT_MS = 10_000

/**
 * Start a heartbeat that calls `refresh` every HEARTBEAT_MS. Returns a stop
 * function to clear the interval (call in finally).
 * @param refresh - Callback invoked on each heartbeat tick.
 */
export const startHeartbeat = (refresh: () => void): (() => void) => {
  const intervalId = setInterval(refresh, HEARTBEAT_MS)

  return () => {
    clearInterval(intervalId)
  }
}
