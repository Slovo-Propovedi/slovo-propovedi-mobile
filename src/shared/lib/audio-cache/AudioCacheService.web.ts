/**
 * Web implementation of the audio cache, backed by the browser Cache Storage
 * API. Downloads a sermon on an explicit "download" tap and stores it in the
 * bucket that the service worker (`public/sw.js`) serves from for offline
 * playback. Playback itself is transparent — the `<audio>` element keeps using
 * the network URL and the service worker swaps in the cached bytes.
 */

import { inflightCache, type InflightEntry, resetInflightCache } from './inflightCache'
import {
  clearAudioCache,
  deleteAudioEntry,
  downloadAndStoreAudio,
  hasCompleteAudio,
  summarizeAudioCache,
} from './webCacheApi'

export interface CacheInfo {
  fileCount: number
  totalSize: number
}

export const _resetInflightCacheForTesting = (): void => {
  resetInflightCache()
}

class WebAudioCacheService {
  // Playback is routed through the service worker, so there is no distinct local URI.
  public getCachedUri = async (): Promise<null | string> => null

  public isCached = async (audioUrl: string): Promise<boolean> => {
    if (!audioUrl) return false
    try {
      return await hasCompleteAudio(audioUrl)
    } catch (error) {
      console.error('[AudioCacheService] Error checking cache status:', error)
      return false
    }
  }

  public getCacheInfo = async (): Promise<CacheInfo> => {
    try {
      return await summarizeAudioCache()
    } catch (error) {
      console.error('[AudioCacheService] Error getting cache info:', error)
      return { fileCount: 0, totalSize: 0 }
    }
  }

  public cacheAudio = (
    audioUrl: string,
    onProgress?: (progress: number) => void,
  ): Promise<string> => {
    if (!audioUrl) throw new Error('[AudioCacheService] audioUrl is required')

    const existing = inflightCache.get(audioUrl)
    if (existing) {
      if (onProgress) {
        existing.callbacks.add(onProgress)
        if (existing.lastValue > 0)
          try {
            onProgress(existing.lastValue)
          } catch (err) {
            console.error('[AudioCacheService] onProgress callback error:', err)
          }
      }
      return existing.promise
    }

    const callbacks = new Set<(progress: number) => void>()
    if (onProgress) callbacks.add(onProgress)

    const entry: InflightEntry = {
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
    entry.promise = downloadAndStoreAudio(audioUrl, entry.emit)
    inflightCache.set(audioUrl, entry)
    const cleanup = (): void => {
      callbacks.clear()
      inflightCache.delete(audioUrl)
    }
    entry.promise.then(cleanup, cleanup)
    return entry.promise
  }

  public clearCache = async (): Promise<void> => {
    try {
      await clearAudioCache()
    } catch (error) {
      console.error('[AudioCacheService] Error clearing cache:', error)
      throw error
    }
  }

  public removeFromCache = async (audioUrl: string): Promise<boolean> => {
    if (!audioUrl) return false
    try {
      return await deleteAudioEntry(audioUrl)
    } catch (error) {
      console.error('[AudioCacheService] Error removing from cache:', error)
      return false
    }
  }
}

export const audioCacheService = new WebAudioCacheService()
export const removeFromCache = audioCacheService.removeFromCache
export const cacheAudio = audioCacheService.cacheAudio
