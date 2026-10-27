import { bumpSessionCacheEpoch } from './sessionCacheEpoch'
import { clearSessionCacheRecords } from './sessionCacheStorage'

/**
 * Wipes the whole session-scoped cache (sign-out, expired session, server
 * change). Never rejects: a failed wipe is logged, auth flows must go on.
 */
export const clearSessionCache = async (): Promise<void> => {
  bumpSessionCacheEpoch()
  try {
    await clearSessionCacheRecords()
  } catch (error) {
    console.error('[session-cache] clear failed:', error)
  }
}
