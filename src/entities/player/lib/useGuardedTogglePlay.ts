import { useAtom } from '@reatom/npm-react'
import { useCallback } from 'react'
import { reportError } from 'shared/model/error-dialog'
import { isOnlineAtom } from 'shared/model/network'
import { currentAudioAtom, isPlayingAtom } from '../model'
import { guardOfflinePlayback } from './playOfflineGuard'
import { usePlayer } from './usePlayer'

const TOGGLE_PLAY_ERROR_MESSAGE = 'Ошибка при переключении воспроизведения'

/**
 * Single guarded toggle-play for every play/pause button. Pause is never
 * blocked; pause → play passes through guardOfflinePlayback (offline +
 * uncached shows the dialog and blocks). Without a current audioUrl the tap
 * is a no-op, matching usePlaySermon's early return.
 */
export const useGuardedTogglePlay = () => {
  const { pause, play } = usePlayer()
  const [isOnline] = useAtom(isOnlineAtom)
  const [currentAudio] = useAtom(currentAudioAtom)
  const [isPlaying] = useAtom(isPlayingAtom)

  const togglePlay = useCallback(async () => {
    try {
      if (isPlaying) return await pause()
      const audioUrl = currentAudio?.audioUrl
      if (!audioUrl) return
      if (await guardOfflinePlayback(audioUrl, isOnline)) return
      return await play()
    } catch (error) {
      if (error instanceof Error && error.message.includes('activity is no longer available'))
        console.warn('[Player] Ignoring AppState-related error:', error.message)
      else {
        console.error('[Player] togglePlay error:', error)
        reportError(error, TOGGLE_PLAY_ERROR_MESSAGE)
        throw error
      }
    }
  }, [currentAudio, isOnline, isPlaying, pause, play])

  return { togglePlay }
}
