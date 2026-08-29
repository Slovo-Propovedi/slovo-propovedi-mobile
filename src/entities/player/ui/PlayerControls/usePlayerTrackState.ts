import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { getIndexOfCurrentAudioInPlaylist } from '../getIndexOfCurrentAudioInPlaylist'

interface UsePlayerTrackStateParams {
  currentAudio: AudioPlayerData | null
  currentPlaylist: null | PlaylistData
}

interface UsePlayerTrackStateResult {
  hasValidPlaylist: boolean
  index: number | undefined
  playlistList: PlaylistData['sermons']
}

/**
 * Определяет состояние текущего трека в плейлисте.
 * Возвращает индекс, список и валидность плейлиста.
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

  return {
    hasValidPlaylist,
    index,
    playlistList,
  }
}
