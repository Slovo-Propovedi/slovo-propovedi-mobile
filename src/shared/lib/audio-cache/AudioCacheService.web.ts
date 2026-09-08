/**
 * Web implementation of the audio cache, backed by the browser Cache Storage
 * API. Downloads a sermon on an explicit "download" tap and stores it in the
 * bucket that the service worker (`public/sw.js`) serves from for offline
 * playback. Playback itself is transparent — the `<audio>` element keeps using
 * the network URL and the service worker swaps in the cached bytes.
 */

import { inflightCache, resetInflightCache } from './inflightCache'
import { createInflightDownload, joinInflightDownload } from './inflightDownload'
import {
  clearAudioCache,
  deleteAudioEntry,
  downloadAndStoreAudio,
  hasCompleteAudio,
} from './webCacheApi'
import { summarizeAudioCache } from './webCacheSummary'

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
    externalSignal?: AbortSignal,
  ): Promise<string> => {
    if (!audioUrl) throw new Error('[AudioCacheService] audioUrl is required')

    const existing = inflightCache.get(audioUrl)
    if (existing) return joinInflightDownload(existing, onProgress)

    const { cleanup, entry } = createInflightDownload(onProgress, externalSignal, (emit, signal) =>
      downloadAndStoreAudio(audioUrl, emit, signal),
    )
    const promise = entry.promise
    inflightCache.set(audioUrl, entry)
    const cleanupEntry = (): void => {
      cleanup()
      inflightCache.delete(audioUrl)
    }
    promise.then(cleanupEntry, cleanupEntry)
    return promise
  }

  public cancelAudioDownload = (audioUrl: string): boolean => {
    const entry = inflightCache.get(audioUrl)
    if (!entry?.abort) return false
    entry.abort()
    return true
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
export const cancelAudioDownload = audioCacheService.cancelAudioDownload
