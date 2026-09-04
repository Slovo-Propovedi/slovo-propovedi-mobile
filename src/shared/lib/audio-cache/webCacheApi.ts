/**
 * Low-level access to the browser Cache Storage bucket that holds downloaded
 * sermon audio on web. The service worker (`public/sw.js`) reads the same
 * bucket to serve audio offline, so the name must stay in sync.
 */

// Keep in sync with AUDIO_CACHE in public/sw.js
export const AUDIO_CACHE_NAME = 'audio-cache-v1'

export interface AudioCacheSummary {
  fileCount: number
  totalSize: number
}

export const isCacheStorageAvailable = (): boolean =>
  typeof caches !== 'undefined' && typeof caches.open === 'function'

const openAudioCache = (): Promise<Cache> => caches.open(AUDIO_CACHE_NAME)

export const cacheHasAudio = async (audioUrl: string): Promise<boolean> => {
  if (!isCacheStorageAvailable()) return false
  const cache = await openAudioCache()
  return (await cache.match(audioUrl, { ignoreVary: true })) != null
}

export const putAudioResponse = async (audioUrl: string, response: Response): Promise<void> => {
  if (!isCacheStorageAvailable()) return
  const cache = await openAudioCache()
  await cache.put(audioUrl, response)
}

export const deleteAudioEntry = async (audioUrl: string): Promise<boolean> => {
  if (!isCacheStorageAvailable()) return false
  const cache = await openAudioCache()
  return cache.delete(audioUrl, { ignoreVary: true })
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
  for (const request of requests) {
    const response = await cache.match(request)
    // Opaque (cross-origin, no CORS) responses report no length — skip them.
    const declared = Number(response?.headers.get('Content-Length'))
    if (Number.isFinite(declared) && declared > 0) totalSize += declared
  }

  return { fileCount: requests.length, totalSize }
}
