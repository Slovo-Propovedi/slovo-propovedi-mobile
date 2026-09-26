import { bridgeAbortSignal } from './abortBridge'
import { type InflightEntry } from './inflightCache'

export interface InflightDownloadHandle {
  cleanup: () => void
  entry: InflightEntry
}

/**
 * Creates the inflight entry that owns a fresh download: builds the internal
 * AbortController (bridged to an optional external signal), the progress
 * fan-out, and starts the download. The returned cleanup detaches the external
 * abort listener and clears the controller reference.
 * @param onProgress - Progress callback for the download (0..1).
 * @param externalSignal - Optional signal that cancels the download.
 * @param startDownload - Starts the platform download with the fan-out emit and
 * the internal abort signal.
 */
export const createInflightDownload = (
  onProgress: ((progress: number) => void) | undefined,
  externalSignal: AbortSignal | undefined,
  startDownload: (emit: (progress: number) => void, signal: AbortSignal) => Promise<string>,
): InflightDownloadHandle => {
  const controller = new AbortController()
  const unsubscribeExternalAbort = bridgeAbortSignal(externalSignal, controller)

  const callbacks = new Set<(progress: number) => void>()
  if (onProgress) callbacks.add(onProgress)
  const entry: InflightEntry = {
    abort: () => controller.abort(),
    callbacks,
    emit: (progress: number) => {
      entry.lastValue = progress
      for (const cb of callbacks)
        try {
          cb(progress)
        } catch (err) {
          console.error('[AudioCacheService] onProgress callback error:', err)
        }
    },
    lastValue: 0,
    promise: Promise.resolve(''),
  }
  entry.promise = startDownload(entry.emit, controller.signal)
  const cleanup = (): void => {
    callbacks.clear()
    unsubscribeExternalAbort()
    entry.abort = undefined
  }
  return { cleanup, entry }
}

/**
 * Joins an existing inflight download: registers the progress callback and
 * seeds it with the last reported value, then returns the shared promise.
 * @param entry - The inflight entry to join.
 * @param onProgress - Progress callback to register (0..1).
 */
export const joinInflightDownload = (
  entry: InflightEntry,
  onProgress: ((progress: number) => void) | undefined,
): Promise<string> => {
  if (onProgress) {
    entry.callbacks.add(onProgress)
    if (entry.lastValue > 0)
      try {
        onProgress(entry.lastValue)
      } catch (err) {
        console.error('[AudioCacheService] onProgress callback error:', err)
      }
  }
  return entry.promise
}
