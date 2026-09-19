import { useAction, useAtom } from '@reatom/npm-react'
import { useEffect } from 'react'
import {
  displayedProgressStateAtom,
  setDisplayedProgressStateAction,
} from './displayedProgressModel'
import { useBufferedProgressForUrl } from './useBufferedProgressForUrl'
import { useDownloadProgressForUrl } from './useDownloadProgressForUrl'

/**
 * Monotonic download progress for the display layer: never drops when a
 * download restarts (network restore) — the bar holds the maximum shown
 * value and keeps growing once the real download catches up. Resets to 0
 * when the download completes (success-clear) or nothing is downloading.
 * @param audioUrl The audio URL to resolve progress for.
 */
export const useDisplayedDownloadProgress = (audioUrl: string): number => {
  const downloadProgress = useDownloadProgressForUrl(audioUrl)
  const bufferedProgress = useBufferedProgressForUrl(audioUrl)
  const [displayed] = useAtom(displayedProgressStateAtom)
  const previous = displayed !== null && displayed.url === audioUrl ? displayed.progress : 0
  const raw = downloadProgress > 0 ? downloadProgress : bufferedProgress
  const displayedProgress = raw <= 0 ? 0 : Math.max(previous, raw)
  const setDisplayedProgress = useAction(setDisplayedProgressStateAction)

  useEffect(() => {
    if (displayedProgress !== previous)
      setDisplayedProgress({ progress: displayedProgress, url: audioUrl })
  }, [audioUrl, displayedProgress, previous, setDisplayedProgress])

  return displayedProgress
}
