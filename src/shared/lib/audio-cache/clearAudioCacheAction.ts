import { action } from '@reatom/framework'
import { clearCachedUrls, incrementCacheTrigger } from '../cache-triggers'
import { audioCacheService } from './AudioCacheService'
import { hasInflightCacheDownloads } from './inflightCache'

export const clearAudioCacheAction = action(async ctx => {
  // Press-time belt-and-suspenders on a destructive op (mirrors the playlist
  // menu guard): clearing the cache directory mid-download could delete the
  // .part file the queue runner is writing. Silent no-op — no overlay clear,
  // no trigger increment.
  if (hasInflightCacheDownloads()) return { success: false }
  try {
    await audioCacheService.clearCache()
    clearCachedUrls(ctx)
    incrementCacheTrigger(ctx)
    return { success: true }
  } catch (error) {
    return { error, success: false }
  }
}, 'clearAudioCacheAction')
