import { File } from 'expo-file-system'
import { waitForOnline } from '../network/waitForOnline'
import { runDownloadAttempt } from './attemptDownload'
import { CacheCancelledError } from './CacheCancelledError'
import {
  MAX_DOWNLOAD_ATTEMPTS,
  RETRY_BACKOFF_DELAYS_MS,
  sleepAbortable,
  WAIT_ONLINE_BEFORE_RETRY_MS,
} from './downloadRetryPolicy'
import { getAudioCacheDirectory } from './getAudioCacheDirectory'

const CACHED_EXTENSION = '.mp3'
export const PART_SUFFIX = '.mp3.part'

export const getUrlHash = (url: string): string => {
  let hash = 0
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

export const getCachedFile = (audioUrl: string): File => {
  const hash = getUrlHash(audioUrl)
  return new File(getAudioCacheDirectory(), `${hash}${CACHED_EXTENSION}`)
}

export const ensureCacheDirectoryExists = (): void => {
  const cacheDir = getAudioCacheDirectory()
  if (!cacheDir.exists) cacheDir.create({ intermediates: true })
}

export const createThrottledProgress = (onProgress: (progress: number) => void) => {
  let last = 0
  return (data: { bytesWritten: number; totalBytes: number }) => {
    if (data.totalBytes <= 0) return
    const fraction = Math.max(0, Math.min(1, data.bytesWritten / data.totalBytes))
    if (fraction - last >= 0.01 || fraction === 1) {
      last = fraction
      onProgress(fraction)
    }
  }
}

const deletePartFile = (partFile: File): void => {
  if (partFile.exists) partFile.delete()
}

/**
 * Bails out of a cancelled download: drops the `.part` file and throws
 * CacheCancelledError so the retry loop never re-attempts a cancelled URL.
 * @param audioUrl - Source URL of the cancelled download.
 * @param tempFile - `.part` file to delete.
 * @param externalSignal - Signal whose aborted state triggers the bail-out.
 */
const throwIfCancelled = (audioUrl: string, tempFile: File, externalSignal?: AbortSignal): void => {
  if (!externalSignal?.aborted) return
  deletePartFile(tempFile)
  throw new CacheCancelledError(audioUrl)
}

/**
 * Downloads a track into the audio cache with retries:
 * up to MAX_DOWNLOAD_ATTEMPTS attempts; between attempts waits for
 * connectivity (bounded) and applies a backoff delay. A stall guard aborts
 * an attempt that stops receiving progress bytes. The `.part` file is kept
 * between attempts and deleted only after the final failed attempt.
 * Cancellation via `externalSignal` is never retried: the `.part` file is
 * dropped and CacheCancelledError is thrown immediately.
 * @param audioUrl - Source audio URL to download into the cache.
 * @param onProgress - Optional callback receiving progress as a 0..1 fraction.
 * @param externalSignal - Optional signal that cancels the download.
 * @returns URI of the cached file.
 */
export const downloadToCache = async (
  audioUrl: string,
  onProgress?: (progress: number) => void,
  externalSignal?: AbortSignal,
): Promise<string> => {
  ensureCacheDirectoryExists()
  const cachedFile = getCachedFile(audioUrl)
  if (cachedFile.exists) return cachedFile.uri

  const hash = getUrlHash(audioUrl)
  const tempFile = new File(getAudioCacheDirectory(), `${hash}${PART_SUFFIX}`)
  // Drop a stale `.part` orphaned by a killed app — the file is kept between
  // retries below, but must not survive from a previous (interrupted) session.
  deletePartFile(tempFile)
  const throttledProgress = onProgress ? createThrottledProgress(onProgress) : undefined

  let lastError: unknown = null
  for (let attemptIndex = 0; attemptIndex < MAX_DOWNLOAD_ATTEMPTS; attemptIndex++) {
    if (attemptIndex > 0) {
      await waitForOnline(WAIT_ONLINE_BEFORE_RETRY_MS, externalSignal)
      await sleepAbortable(RETRY_BACKOFF_DELAYS_MS[attemptIndex - 1], externalSignal)
    }
    throwIfCancelled(audioUrl, tempFile, externalSignal)
    if (onProgress) onProgress(0)

    try {
      await runDownloadAttempt({
        externalSignal,
        onProgressTick: throttledProgress,
        tempFile,
        url: audioUrl,
      })
      if (onProgress) onProgress(1)
      tempFile.rename(`${hash}${CACHED_EXTENSION}`)
      return cachedFile.uri
    } catch (error) {
      // Cancellation must not be retried; other errors are retried because RN
      // download failures don't reliably expose HTTP status.
      throwIfCancelled(audioUrl, tempFile, externalSignal)
      lastError = error
    }
  }

  deletePartFile(tempFile)
  console.error('[AudioCacheService] Error caching audio:', lastError)
  throw lastError
}
