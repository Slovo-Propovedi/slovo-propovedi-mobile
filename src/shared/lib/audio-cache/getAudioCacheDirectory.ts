import { Directory, Paths } from 'expo-file-system'

const AUDIO_CACHE_DIR_NAME = 'audio-cache'

export const getAudioCacheDirectory = (): Directory =>
  new Directory(Paths.document, AUDIO_CACHE_DIR_NAME)
