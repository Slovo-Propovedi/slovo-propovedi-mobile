import { action, atom } from '@reatom/framework'

// Download caching atoms
export const downloadProgressAtom = atom<number>(0, 'downloadProgressAtom')
export const isDownloadingAtom = atom<boolean>(false, 'isDownloadingAtom')
export const downloadingAudioUrlAtom = atom<null | string>(null, 'downloadingAudioUrlAtom')

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
