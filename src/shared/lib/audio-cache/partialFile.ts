import { File } from 'expo-file-system'
import { getUrlHash, PART_SUFFIX } from './cacheDownloader'
import { getAudioCacheDirectory } from './getAudioCacheDirectory'

/**
 * Returns the partial download file for a track URL. The file is retained
 * after a failed download so the user can play the buffered part offline.
 * @param audioUrl - Network URL of the track.
 * @returns The partial file handle (may not exist yet).
 */
export const getPartialFile = (audioUrl: string): File =>
  new File(getAudioCacheDirectory(), `${getUrlHash(audioUrl)}${PART_SUFFIX}`)

/**
 * Returns the URI of a non-empty partial download for the track, or null when
 * there is nothing playable. The try/catch makes web (no real file system)
 * safely resolve null.
 * @param audioUrl - Network URL of the track.
 * @returns URI of the partial file, or null.
 */
export const getPartialFileUri = async (audioUrl: string): Promise<null | string> => {
  if (!audioUrl) return null
  try {
    const file = getPartialFile(audioUrl)
    if (file.exists && (file.size ?? 0) > 0) return file.uri
    return null
  } catch (error) {
    console.warn('[audio-cache] Error checking partial file:', error)
    return null
  }
}
