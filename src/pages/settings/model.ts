import { action } from '@reatom/framework'
import { audioCacheService, hasInflightCacheDownloads } from 'shared/lib/audio-cache'
import { clearCachedUrls, incrementCacheTrigger } from 'shared/lib/cache-triggers'

export const clearCacheAction = action(async ctx => {
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
}, 'clearCacheAction')
