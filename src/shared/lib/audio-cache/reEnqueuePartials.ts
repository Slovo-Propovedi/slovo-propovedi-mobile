import { type Ctx } from '@reatom/framework'
import { File } from 'expo-file-system'
import { audioCacheService } from './AudioCacheService'
import { getUrlHash, PART_SUFFIX } from './cacheDownloader'
import { enqueueCacheMany } from './cacheQueueEnqueueMany'
import { getAudioCacheDirectory } from './getAudioCacheDirectory'
import { offlineRegistryAtom } from './offlineSermonsRegistry'
import { deletePartialFile } from './partialFile'

/**
 * Startup/reconnect sweep: stale partials of known offline sermons are
 * re-downloaded fresh; partials whose final file is already cached are just
 * deleted; unknown hashes are left alone. Best-effort, never throws.
 * @param ctx - Reatom context for atom updates.
 */
export const reEnqueuePartialDownloads = async (ctx: Ctx): Promise<void> => {
  try {
    const cacheDir = getAudioCacheDirectory()
    if (!cacheDir.exists) return

    const partialFiles = cacheDir
      .list()
      .filter((item): item is File => item instanceof File && item.name.endsWith(PART_SUFFIX))

    const urlsToReEnqueue: string[] = []
    for (const partialFile of partialFiles) {
      const hash = partialFile.name.slice(0, -PART_SUFFIX.length)
      const url = Object.keys(ctx.get(offlineRegistryAtom)).find(
        candidate => getUrlHash(candidate) === hash,
      )
      if (!url) continue
      if (await audioCacheService.isCached(url)) {
        void deletePartialFile(url)
        continue
      }
      urlsToReEnqueue.push(url)
    }

    if (urlsToReEnqueue.length > 0) await enqueueCacheMany(ctx, urlsToReEnqueue, 'auto')
  } catch (error) {
    console.warn('[reEnqueuePartials] failed:', error)
  }
}
