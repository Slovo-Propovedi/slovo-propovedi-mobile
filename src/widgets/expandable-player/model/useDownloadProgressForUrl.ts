import { useAtom } from '@reatom/npm-react'
import { downloadingAudioUrlAtom, downloadProgressAtom, isDownloadingAtom } from 'entities/player'

/**
 * Resolves the download progress fraction for a specific audio URL.
 * Returns 0 unless the currently downloading URL matches — a background
 * download of a different sermon never shows progress on this track.
 * @param audioUrl The audio URL to match against the downloading URL.
 */
export const useDownloadProgressForUrl = (audioUrl: string): number => {
  const [isDownloading] = useAtom(isDownloadingAtom)
  const [downloadingAudioUrl] = useAtom(downloadingAudioUrlAtom)
  const [downloadProgress] = useAtom(downloadProgressAtom)

  return isDownloading && downloadingAudioUrl === audioUrl ? downloadProgress : 0
}
