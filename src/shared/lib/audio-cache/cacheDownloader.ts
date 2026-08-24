import { File } from 'expo-file-system'
import { waitForOnline } from '../network/waitForOnline'
import { runDownloadAttempt } from './attemptDownload'
import {
  MAX_DOWNLOAD_ATTEMPTS,
  RETRY_BACKOFF_DELAYS_MS,
  sleep,
  WAIT_ONLINE_BEFORE_RETRY_MS,
} from './downloadRetryPolicy'
import { getAudioCacheDirectory } from './getAudioCacheDirectory'

const CACHED_EXTENSION = '.mp3'
const PART_SUFFIX = '.mp3.part'

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
 * Downloads a track into the audio cache with retries:
 * up to MAX_DOWNLOAD_ATTEMPTS attempts; between attempts waits for
 * connectivity (bounded) and applies a backoff delay. A stall guard aborts
 * an attempt that stops receiving progress bytes. The `.part` file is kept
 * between attempts and deleted only after the final failed attempt.
 * @param audioUrl - Source audio URL to download into the cache.
 * @param onProgress - Optional callback receiving progress as a 0..1 fraction.
 * @returns URI of the cached file.
 */
export const downloadToCache = async (
  audioUrl: string,
  onProgress?: (progress: number) => void,
): Promise<string> => {
  ensureCacheDirectoryExists()
  const cachedFile = getCachedFile(audioUrl)
  if (cachedFile.exists) return cachedFile.uri

  const hash = getUrlHash(audioUrl)
  const tempFile = new File(getAudioCacheDirectory(), `${hash}${PART_SUFFIX}`)
  const throttledProgress = onProgress ? createThrottledProgress(onProgress) : undefined

  let lastError: unknown = null
  for (let attemptIndex = 0; attemptIndex < MAX_DOWNLOAD_ATTEMPTS; attemptIndex++) {
    if (attemptIndex > 0) {
      await waitForOnline(WAIT_ONLINE_BEFORE_RETRY_MS)
      await sleep(RETRY_BACKOFF_DELAYS_MS[attemptIndex - 1])
    }
    if (onProgress) onProgress(0)

    try {
      await runDownloadAttempt({ onProgressTick: throttledProgress, tempFile, url: audioUrl })
      if (onProgress) onProgress(1)
      tempFile.rename(`${hash}${CACHED_EXTENSION}`)
      return cachedFile.uri
    } catch (error) {
      // Retry every error: RN download failures don't reliably expose HTTP status.
      lastError = error
    }
  }

  deletePartFile(tempFile)
  console.error('[AudioCacheService] Error caching audio:', lastError)
  throw lastError
}
