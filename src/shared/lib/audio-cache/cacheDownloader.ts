import { File } from 'expo-file-system'
import { getAudioCacheDirectory } from './getAudioCacheDirectory'

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
  return new File(getAudioCacheDirectory(), `${hash}.mp3`)
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

export const downloadToCache = async (
  audioUrl: string,
  onProgress?: (progress: number) => void,
): Promise<string> => {
  try {
    ensureCacheDirectoryExists()
    const cachedFile = getCachedFile(audioUrl)
    if (cachedFile.exists) return cachedFile.uri
    const tempFile = new File(getAudioCacheDirectory(), `${getUrlHash(audioUrl)}.mp3.part`)
    if (onProgress) onProgress(0)
    await File.downloadFileAsync(audioUrl, tempFile, {
      idempotent: true,
      onProgress: onProgress ? createThrottledProgress(onProgress) : undefined,
    })
    if (onProgress) onProgress(1)
    tempFile.rename(`${getUrlHash(audioUrl)}.mp3`)
    return cachedFile.uri
  } catch (error) {
    const tempFile = new File(getAudioCacheDirectory(), `${getUrlHash(audioUrl)}.mp3.part`)
    if (tempFile.exists) tempFile.delete()
    console.error('[AudioCacheService] Error caching audio:', error)
    throw error
  }
}
