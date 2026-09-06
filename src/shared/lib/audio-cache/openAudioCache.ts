/**
 * Opening and repairing the browser Cache Storage bucket that holds downloaded
 * sermon audio on web. The service worker (`public/sw.js`) reads the same
 * bucket to serve audio offline, so the bucket name must stay in sync.
 */

// Keep in sync with AUDIO_CACHE in public/sw.js
export const AUDIO_CACHE_NAME = 'audio-cache-v1'

/**
 * Open the audio cache bucket, repairing a corrupt Cache Storage on the fly.
 * A killed process can leave the bucket half-written (WebKit bugs 260962 /
 * 305539), after which `caches.open` throws raw TypeErrors. The only
 * JS-reachable repair is dropping the bucket and reopening it.
 */
export const openAudioCache = async (): Promise<Cache> => {
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
