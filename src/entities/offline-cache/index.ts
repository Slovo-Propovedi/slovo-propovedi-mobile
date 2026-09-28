export { audioCacheService, removeFromCache } from './lib/AudioCacheService'
export { cacheAudioWithProgress } from './lib/cacheAudioWithProgress'
export { CacheCancelledError, isCacheCancelledError } from './lib/CacheCancelledError'
export { PART_SUFFIX } from './lib/cacheDownloader'
export {
  cancelAllCacheDownloads,
  cancelCacheDownload,
  removeFromQueueBySource,
} from './lib/cacheQueue'
export { enqueueCache } from './lib/cacheQueueEnqueue'
export { enqueueCacheMany } from './lib/cacheQueueEnqueueMany'
export { getCacheRequesters } from './lib/cacheQueueRegistries'
export {
  activeCacheUrlAtom,
  cacheQueueAtom,
  type CacheQueueEntry,
  registerPlaylistRunStopper,
  unregisterPlaylistRunStopper,
} from './lib/cacheQueueState'
export { cleanupOrphanedDownloads } from './lib/cleanupOrphans'
export { clearAudioCacheAction } from './lib/clearAudioCacheAction'
export { hasInflightCacheDownloads, waitForInflightCacheDownloads } from './lib/inflightCache'
export { isUrlQueuedOrActive } from './lib/isUrlQueuedOrActive'
export {
  clearOfflineRegistry,
  flushOfflineRegistryPersist,
  hydrateOfflineRegistry,
  offlineRegistryAtom,
  registerOfflineSermon,
  removeOfflineSermon,
} from './lib/offlineSermonsRegistry'
export { deletePartialFile, getPartialFileUri } from './lib/partialFile'
export { reEnqueuePartialDownloads } from './lib/reEnqueuePartials'
export {
  resolveCacheState,
  type ResolveCacheStateInput,
  type TrackCacheVisualState,
} from './lib/resolveCacheState'
export {
  loadSermonCachingEnabled,
  sermonCachingEnabledAtom,
  setSermonCachingEnabled,
} from './lib/sermonCachingSetting'
export { OFFLINE_SERMONS_REGISTRY, OFFLINE_SERMONS_REGISTRY_SEEDED } from './lib/storageKeys'
export { useIsCached } from './lib/useIsCached'
export {
  cachedUrlsAtom,
  cacheUpdateTriggerAtom,
  clearCachedUrls,
  incrementCacheTrigger,
  markUrlCached,
  markUrlEvicted,
  playlistDownloadProgressAtom,
  removeTrackDownloadProgress,
  setTrackDownloadProgress,
} from './model'
export { useTrackItemCache } from './ui/useTrackItemCache'
