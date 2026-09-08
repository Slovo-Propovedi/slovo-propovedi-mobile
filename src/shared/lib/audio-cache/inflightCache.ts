export interface InflightEntry {
  /** Aborts the in-flight download; set only on the entry that owns the download. */
  abort?: () => void
  callbacks: Set<(progress: number) => void>
  emit: (progress: number) => void
  lastValue: number
  promise: Promise<string>
}

export const inflightCache = new Map<string, InflightEntry>()

export const resetInflightCache = (): void => {
  inflightCache.clear()
}

/**
 * Returns true if any audio download is currently in-flight.
 *
 * Note: `inflightCache` is a plain Map — not a Reatom atom — so this getter
 * is NOT reactive. Since Issue #83 every download flows through the global
 * queue, the reactive source for "a download is active" is
 * `activeCacheUrlAtom` (the URL the queue runner is processing, or null when
 * idle). UI that must reflect download state reactively should subscribe to
 * `activeCacheUrlAtom`; this getter is kept for imperative checks (e.g. The
 * press-time guard on «Удалить из кеша все») and legacy callers.
 */
export const hasInflightCacheDownloads = (): boolean => inflightCache.size > 0
