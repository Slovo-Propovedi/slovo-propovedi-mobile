import { action, atom } from '@reatom/framework'

// True while the stream stalled offline (buffering with no network) and playback
// was auto-paused. Cleared when a new source is loaded (AudioLoader) or playback
// resumes (web 'playing' event). Drives auto-resume on reconnect (Issue #109).
export const isStalledOfflineAtom = atom<boolean>(false, 'isStalledOfflineAtom')

export const setIsStalledOfflineAction = action((ctx, stalledOffline: boolean) => {
  if (ctx.get(isStalledOfflineAtom) === stalledOffline) return stalledOffline
  isStalledOfflineAtom(ctx, stalledOffline)
  return stalledOffline
}, 'setIsStalledOffline')
