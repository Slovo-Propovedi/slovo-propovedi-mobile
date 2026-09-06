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

/**
 * Open the audio cache bucket, repairing a corrupt Cache Storage on the fly.
 * A killed process can leave the bucket half-written (WebKit bugs 260962 /
 * 305539), after which `caches.open` throws raw TypeErrors. The only
 * JS-reachable repair is dropping the bucket and reopening it.
 */
const openAudioCache = async (): Promise<Cache> => {
  try {
    return await caches.open(AUDIO_CACHE_NAME)
  } catch (error) {
    console.error('[audio-cache] Opening cache bucket failed, dropping and retrying:', error)
    await caches.delete(AUDIO_CACHE_NAME)
    try {
      return await caches.open(AUDIO_CACHE_NAME)
    } catch (retryError) {
      console.error('[audio-cache] Cache bucket remains unusable:', retryError)
      throw new Error('[audio-cache] Cache Storage is unavailable', { cause: retryError })
    }
  }
}

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
