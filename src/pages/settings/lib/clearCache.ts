import { audioCacheService } from 'shared/lib/audio-cache'

export const clearCache = async (): Promise<void> => await audioCacheService.clearCache()
