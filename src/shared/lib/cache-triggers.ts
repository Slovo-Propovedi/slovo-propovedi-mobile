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
    if (!(url in prev)) return prev
    const next = { ...prev }
    delete next[url]
    return next
  })
  return url
}, 'removeTrackDownloadProgress')
