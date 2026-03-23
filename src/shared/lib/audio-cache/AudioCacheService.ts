import { File } from 'expo-file-system'
import { getAudioCacheDirectory } from './getAudioCacheDirectory'

export interface CacheInfo {
  fileCount: number
  totalSize: number
}

const getUrlHash = (url: string): string => {
  // Simple hash function to create a unique filename from URL
  let hash = 0
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  // Convert to base36 for shorter string and make it positive
  return Math.abs(hash).toString(36)
}

const getCachedFile = (audioUrl: string): File => {
  const hash = getUrlHash(audioUrl)
  return new File(getAudioCacheDirectory(), `${hash}.mp3`)
}

const ensureCacheDirectoryExists = (): void => {
  const cacheDir = getAudioCacheDirectory()
  if (!cacheDir.exists) cacheDir.create({ intermediates: true })
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
      const files = await cacheDir.list()
      let totalSize = 0
      for (const file of files) if (file instanceof File) totalSize += file.size ?? 0
      return { fileCount: files.length, totalSize }
    } catch (error) {
      console.error('[AudioCacheService] Error getting cache info:', error)
      return { fileCount: 0, totalSize: 0 }
    }
  }

  public cacheAudio = async (
    audioUrl: string,
    onProgress?: (progress: number) => void,
  ): Promise<string> => {
    if (!audioUrl) throw new Error('[AudioCacheService] audioUrl is required')
    try {
      ensureCacheDirectoryExists()
      const cachedFile = getCachedFile(audioUrl)
      if (cachedFile.exists) return cachedFile.uri
      if (onProgress) onProgress(0)
      const downloadedFile = await File.downloadFileAsync(audioUrl, cachedFile, {
        idempotent: true,
      })
      if (onProgress) onProgress(1)
      return downloadedFile.uri
    } catch (error) {
      console.error('[AudioCacheService] Error caching audio:', error)
      throw error
    }
  }

  public clearCache = async (): Promise<void> => {
    try {
      const cacheDir = getAudioCacheDirectory()
      if (cacheDir.exists) await cacheDir.delete()
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
        await cachedFile.delete()
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
