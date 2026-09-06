/**
 * Low-level access to the browser Cache Storage bucket that holds downloaded
 * sermon audio on web. The service worker (`public/sw.js`) reads the same
 * bucket to serve audio offline, so the bucket name must stay in sync.
 */

import { AUDIO_CACHE_NAME, openAudioCache } from './openAudioCache'
import { fetchAudioForCache } from './webAudioDownload'
import {
  commitAudioUrl,
  ensureManifest,
  isManifestUrl,
  isUrlCommitted,
  uncommitAudioUrl,
} from './webCacheManifest'

export interface AudioCacheSummary {
  fileCount: number
  totalSize: number
}

export const isCacheStorageAvailable = (): boolean =>
  typeof caches !== 'undefined' && typeof caches.open === 'function'

/**
 * Whether a track is fully downloaded: its entry exists in the bucket AND its
 * canonical URL is committed in the manifest. When the manifest cannot be built
 * (e.g. A legacy bucket that failed to read) it falls back to the legacy
 * `match`-only heuristic so existing downloads keep working.
 * @param audioUrl - Canonical URL of the track.
 */
export const hasCompleteAudio = async (audioUrl: string): Promise<boolean> => {
  if (!isCacheStorageAvailable()) return false
  const cache = await openAudioCache()
  let committed: Set<string>
  try {
    committed = await ensureManifest(cache)
  } catch (error) {
    console.error('[audio-cache] ensureManifest failed, falling back to legacy check:', error)
    return (await cache.match(audioUrl, { ignoreVary: true })) != null
  }
  const present = (await cache.match(audioUrl, { ignoreVary: true })) != null
  return isUrlCommitted(committed, audioUrl) && present
}

export const putAudioResponse = async (audioUrl: string, response: Response): Promise<void> => {
  if (!isCacheStorageAvailable()) return
  const cache = await openAudioCache()
  await cache.put(audioUrl, response)
}

export const deleteAudioEntry = async (audioUrl: string): Promise<boolean> => {
  if (!isCacheStorageAvailable()) return false
  const cache = await openAudioCache()
  const deleted = await cache.delete(audioUrl, { ignoreVary: true })
  try {
    await uncommitAudioUrl(cache, audioUrl)
  } catch (error) {
    console.error('[audio-cache] Failed to uncommit url after delete:', error)
  }
  return deleted
}

export const clearAudioCache = async (): Promise<void> => {
  if (!isCacheStorageAvailable()) return
  await caches.delete(AUDIO_CACHE_NAME)
}

export const summarizeAudioCache = async (): Promise<AudioCacheSummary> => {
  if (!isCacheStorageAvailable()) return { fileCount: 0, totalSize: 0 }
  const cache = await openAudioCache()
  const requests = await cache.keys()

  let totalSize = 0
  let fileCount = 0
  for (const request of requests) {
    if (isManifestUrl(request.url)) continue
    fileCount++
    const response = await cache.match(request)
    // Opaque (cross-origin, no CORS) responses report no length — skip them.
    const declared = Number(response?.headers.get('Content-Length'))
    if (Number.isFinite(declared) && declared > 0) totalSize += declared
  }

  return { fileCount, totalSize }
}

/**
 * Skip a track that is already fully downloaded; otherwise drop any stale
 * uncommitted/truncated entry, download a fresh copy, store it and commit it in
 * the manifest so the service worker serves it offline.
 * @param audioUrl - Canonical URL of the track.
 * @param onProgress - Progress callback (0..1) for the download.
 */
export const downloadAndStoreAudio = async (
  audioUrl: string,
  onProgress: (progress: number) => void,
): Promise<string> => {
  if (await hasCompleteAudio(audioUrl)) {
    onProgress(1)
    return audioUrl
  }
  await deleteAudioEntry(audioUrl).catch(error =>
    console.error('[audio-cache] Error clearing stale cache entry:', error),
  )
  const response = await fetchAudioForCache(audioUrl, onProgress)
  await putAudioResponse(audioUrl, response)
  try {
    // A commit failure only means a re-download next session — never fail the download.
    await commitAudioUrl(await openAudioCache(), audioUrl)
  } catch (error) {
    console.error('[audio-cache] Failed to commit audio url:', error)
  }
  return audioUrl
}
