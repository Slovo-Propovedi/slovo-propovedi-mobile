import { Directory, Paths } from 'expo-file-system'
import { Platform } from 'react-native'

const AUDIO_CACHE_DIR_NAME = 'audio-cache'

export const getAudioCacheDirectory = (): Directory => {
  // Safety net: expo-file-system's Directory has no web implementation. The web
  // build swaps AudioCacheService for AudioCacheService.web, but guard here too
  // so a stale Metro cache can't turn this into a cryptic `validatePath` crash.
  if (Platform.OS === 'web') throw new Error('[audio-cache] file system is not available on web')
  return new Directory(Paths.document, AUDIO_CACHE_DIR_NAME)
}
