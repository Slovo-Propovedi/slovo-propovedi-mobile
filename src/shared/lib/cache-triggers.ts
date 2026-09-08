import { action, atom } from '@reatom/framework'

// Atom for triggering cache updates across the app
// This is a shared atom that can be imported by any layer
export const cacheUpdateTriggerAtom = atom(0, 'cacheUpdateTriggerAtom')

// Action to increment the cache trigger
export const incrementCacheTrigger = action(ctx => {
  cacheUpdateTriggerAtom(ctx, prev => prev + 1)
}, 'incrementCacheTrigger')

// Per-track download progress (0 to 1), keyed by audio URL
// Shared across the app for tracking individual track download progress
export const playlistDownloadProgressAtom = atom<Record<string, number>>(
  {},
  'playlistDownloadProgressAtom',
)

interface TrackDownloadProgress {
  progress: number
  url: string
}

// Action to record per-track download progress for a given audio URL
export const setTrackDownloadProgress = action((ctx, { progress, url }: TrackDownloadProgress) => {
  playlistDownloadProgressAtom(ctx, prev => ({ ...prev, [url]: progress }))
  return progress
}, 'setTrackDownloadProgress')

// Action to drop a per-track progress entry once its download settles
export const removeTrackDownloadProgress = action((ctx, url: string) => {
  playlistDownloadProgressAtom(ctx, prev => {
    if (!Object.hasOwn(prev, url)) return prev
    const next = { ...prev }
    delete next[url]
    return next
  })
  return url
}, 'removeTrackDownloadProgress')

// Optimistic registry of URLs known to be cached in the CURRENT session.
// Populated synchronously when a download settles (see cacheAudioWithProgress)
// so UI can reflect 'cached' without an async File.exists round-trip. It is a
// session-only overlay: NOT persisted, NOT ground truth — a restart falls back
// to a real FS scan. External file mutations (manual FS edits, web cache wipe)
// are covered only by the remaining cacheUpdateTriggerAtom increments.
export const cachedUrlsAtom = atom<Record<string, true>>({}, 'cachedUrlsAtom')

// Action to record that a URL finished caching this session.
export const markUrlCached = action((ctx, url: string) => {
  cachedUrlsAtom(ctx, prev => {
    if (Object.hasOwn(prev, url)) return prev
    return { ...prev, [url]: true }
  })
  return url
}, 'markUrlCached')

// Action to forget a URL that was removed from the cache this session.
export const markUrlEvicted = action((ctx, url: string) => {
  cachedUrlsAtom(ctx, prev => {
    if (!Object.hasOwn(prev, url)) return prev
    const next = { ...prev }
    delete next[url]
    return next
  })
  return url
}, 'markUrlEvicted')

// Action to drop the whole session overlay (e.g. a full cache clear).
export const clearCachedUrls = action(ctx => {
  cachedUrlsAtom(ctx, prev => {
    if (Object.keys(prev).length === 0) return prev
    return {}
  })
}, 'clearCachedUrls')
