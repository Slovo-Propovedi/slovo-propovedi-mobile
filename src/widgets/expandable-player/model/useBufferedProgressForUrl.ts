import { useAtom } from '@reatom/npm-react'
import { bufferedProgressStateAtom } from 'entities/player'

/**
 * Resolves the frozen buffered download progress fraction for a specific audio URL.
 * Returns 0 unless the buffered state matches the URL — a background download of a
 * different sermon never shows progress on this track.
 * @param audioUrl The audio URL to match against the buffered state.
 */
export const useBufferedProgressForUrl = (audioUrl: string): number => {
  const [bufferedState] = useAtom(bufferedProgressStateAtom)

  return bufferedState !== null && bufferedState.url === audioUrl ? bufferedState.progress : 0
}
