import { File } from 'expo-file-system'
import { downloadToCache, ensureCacheDirectoryExists, getCachedFile } from './cacheDownloader'
import { getAudioCacheDirectory } from './getAudioCacheDirectory'
import { inflightCache, type InflightEntry, resetInflightCache } from './inflightCache'

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
      const files = cacheDir.list()
      let totalSize = 0
      for (const file of files) if (file instanceof File) totalSize += file.size ?? 0
      return { fileCount: files.length, totalSize }
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
      promise: null as unknown as Promise<string>,
    }
    const promise = downloadToCache(audioUrl, entry.emit)
    entry.promise = promise
    inflightCache.set(audioUrl, entry)
    promise.then(
      () => {
        callbacks.clear()
        inflightCache.delete(audioUrl)
      },
      () => {
        callbacks.clear()
        inflightCache.delete(audioUrl)
      },
    )
    return promise
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
