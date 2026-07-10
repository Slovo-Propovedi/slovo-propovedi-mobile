import type { AudioPlayerData } from './PlayerControls.types'
import type { PlaylistData } from 'shared/model'
import { getIndexOfCurrentAudioInPlaylist } from '../getIndexOfCurrentAudioInPlaylist'

interface UsePlayerTrackStateParams {
  currentAudio: AudioPlayerData | null
  currentPlaylist: null | PlaylistData
}

interface UsePlayerTrackStateResult {
  hasValidPlaylist: boolean
  index: number | undefined
  isFirstTrack: boolean
  isLastTrack: boolean
  playlistList: PlaylistData['sermons']
}

/**
 * Определяет состояние текущего трека в плейлисте.
 * Возвращает индекс, список, валидность и границы плейлиста.
 * @param root0 - Параметры состояния трека.
 * @param root0.currentAudio - Текущее воспроизводимое аудио.
 * @param root0.currentPlaylist - Текущий плейлист.
 */
export const usePlayerTrackState = ({
  currentAudio,
  currentPlaylist,
}: UsePlayerTrackStateParams): UsePlayerTrackStateResult => {
  const index = getIndexOfCurrentAudioInPlaylist(currentAudio, currentPlaylist)

  const playlistList = currentPlaylist ? currentPlaylist.sermons : []

  const hasValidPlaylist = currentPlaylist != null && index != null

  const isLastTrack = hasValidPlaylist && index === playlistList.length - 1

  const isFirstTrack = hasValidPlaylist && index === 0

  return {
    hasValidPlaylist,
    index,
    isFirstTrack,
    isLastTrack,
    playlistList,
  }
}
