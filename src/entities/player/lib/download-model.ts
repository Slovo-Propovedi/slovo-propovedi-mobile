import { action, atom } from '@reatom/framework'

// Download caching atoms
export const downloadProgressAtom = atom<number>(0, 'downloadProgressAtom')
export const isDownloadingAtom = atom<boolean>(false, 'isDownloadingAtom')
export const downloadingAudioUrlAtom = atom<null | string>(null, 'downloadingAudioUrlAtom')

// Frozen buffered amount of a failed background download. Self-invalidating:
// consumers compare the url to the current track, so no reset-on-track-change is needed.
export const bufferedProgressStateAtom = atom<{ progress: number; url: string } | null>(
  null,
  'bufferedProgressStateAtom',
)

// Download caching actions
export const setDownloadProgressAction = action((ctx, progress: number) => {
  downloadProgressAtom(ctx, progress)
  return progress
}, 'setDownloadProgress')

export const setIsDownloadingAction = action((ctx, isDownloading: boolean) => {
  isDownloadingAtom(ctx, isDownloading)
  return isDownloading
}, 'setIsDownloading')

export const setDownloadingUrlAction = action((ctx, url: null | string) => {
  downloadingAudioUrlAtom(ctx, url)
  return url
}, 'setDownloadingUrl')

export const setBufferedProgressStateAction = action(
  (ctx, state: { progress: number; url: string } | null) => {
    bufferedProgressStateAtom(ctx, state)
    return state
  },
  'setBufferedProgressState',
)
