import { File } from 'expo-file-system'
import {
  downloadToCache,
  ensureCacheDirectoryExists,
  getCachedFile,
  PART_SUFFIX,
} from './cacheDownloader'
import { getAudioCacheDirectory } from './getAudioCacheDirectory'
import { inflightCache, resetInflightCache } from './inflightCache'
import { createInflightDownload, joinInflightDownload } from './inflightDownload'

export interface CacheInfo {
  fileCount: number
  totalSize: number
}

export const _resetInflightCacheForTesting = (): void => {
  resetInflightCache()
}

class AudioCacheService {
  public getCachedUri = async (audioUrl: string): Promise<null | string> => {
    if (!audioUrl) return null
    try {
      ensureCacheDirectoryExists()
      const cachedFile = getCachedFile(audioUrl)
      if (cachedFile.exists) return cachedFile.uri
      return null
    } catch (error) {
      console.error('[AudioCacheService] Error checking cache:', error)
      return null
    }
  }
  public isCached = async (audioUrl: string): Promise<boolean> => {
    if (!audioUrl) return false
    try {
      ensureCacheDirectoryExists()
      return getCachedFile(audioUrl).exists
    } catch (error) {
      console.error('[AudioCacheService] Error checking cache status:', error)
      return false
    }
  }
  public getCacheInfo = async (): Promise<CacheInfo> => {
    try {
      ensureCacheDirectoryExists()
      const cacheDir = getAudioCacheDirectory()
      if (!cacheDir.exists) return { fileCount: 0, totalSize: 0 }
      const cachedFiles = cacheDir
        .list()
        .filter((file): file is File => file instanceof File && !file.name.endsWith(PART_SUFFIX))
      const totalSize = cachedFiles.reduce((sum, file) => sum + (file.size ?? 0), 0)
      return { fileCount: cachedFiles.length, totalSize }
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
    // Join only a live download. An aborted (dying) entry must NOT be joined —
    // its promise rejects with CacheCancelledError; fall through and start a
    // fresh download instead (Bug B, same rule as the queue's inflightIsJoinable).
    if (existing && !existing.aborted) return joinInflightDownload(existing, onProgress)

    const { cleanup, entry } = createInflightDownload(onProgress, externalSignal, (emit, signal) =>
      downloadToCache(audioUrl, emit, signal),
    )
    const promise = entry.promise
    inflightCache.set(audioUrl, entry)
    const cleanupEntry = (): void => {
      cleanup()
      // Identity guard: a fresh entry may have replaced this dying one under the
      // same URL key — never delete the fresh entry from the inflight cache.
      if (inflightCache.get(audioUrl) === entry) inflightCache.delete(audioUrl)
    }
    promise.then(cleanupEntry, cleanupEntry)
    return promise
  }
  public cancelAudioDownload = (audioUrl: string): boolean => {
    const entry = inflightCache.get(audioUrl)
    if (!entry?.abort) return false
    // Mark aborted BEFORE aborting so a re-enqueue of the same URL treats this
    // (dying) entry as non-joinable and starts a fresh download (Bug B).
    entry.aborted = true
    entry.abort()
    return true
  }
  public clearCache = async (): Promise<void> => {
    try {
      const cacheDir = getAudioCacheDirectory()
      if (cacheDir.exists) cacheDir.delete()
    } catch (error) {
      console.error('[AudioCacheService] Error clearing cache:', error)
      throw error
    }
  }
  public removeFromCache = async (audioUrl: string): Promise<boolean> => {
    if (!audioUrl) return false
    try {
      const cachedFile = getCachedFile(audioUrl)
      if (cachedFile.exists) {
        cachedFile.delete()
        return true
      }
      return false
    } catch (error) {
      console.error('[AudioCacheService] Error removing from cache:', error)
      return false
    }
  }
}

export const audioCacheService = new AudioCacheService()
export const removeFromCache = audioCacheService.removeFromCache
export const cacheAudio = audioCacheService.cacheAudio
export const cancelAudioDownload = audioCacheService.cancelAudioDownload
