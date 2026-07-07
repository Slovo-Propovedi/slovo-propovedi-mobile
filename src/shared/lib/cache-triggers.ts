import { atom, type Ctx } from '@reatom/framework'

// Atom for triggering cache updates across the app
// This is a shared atom that can be imported by any layer
export const cacheUpdateTriggerAtom = atom(0, 'cacheUpdateTriggerAtom')

// Action to increment the cache trigger
export const incrementCacheTrigger = (ctx: Ctx) => {
  cacheUpdateTriggerAtom(ctx, prev => prev + 1)
}

// Per-track download progress (0 to 1), keyed by audio URL
// Shared across the app for tracking individual track download progress
export const playlistDownloadProgressAtom = atom<Record<string, number>>(
  {},
  'playlistDownloadProgressAtom',
)
