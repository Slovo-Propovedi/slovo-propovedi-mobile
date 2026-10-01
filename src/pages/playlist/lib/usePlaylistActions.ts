import { useCallback } from 'react'
import { buildHistoryMenuActions } from 'entities/listening-history'
import { usePlayNewSermon } from 'entities/player'
import { type PlaylistData } from 'entities/playlist'
import { type AudioPlayerData, type SermonData, toAudioPlayerData } from 'entities/sermon'
import { type MenuItem } from 'shared/ui/menu'

/**
 * Composes the playlist screen's per-item actions: press-to-play, play-all and
 * the context-menu actions built from listening-history state.
 * @param list - The playlist's sermons backing the track rows.
 * @param playlist - The playlist being displayed.
 * @param historySermonIds - Sermon ids present in listening history.
 * @param progressMap - Stored listening progress by sermon id (0..1).
 * @param onAddToPlaylist - Opens the add-to-playlist modal for a sermon.
 */
export const usePlaylistActions = (
  list: SermonData[],
  playlist: PlaylistData,
  historySermonIds: Set<string>,
  progressMap: Map<string, number>,
  onAddToPlaylist?: (sermon: AudioPlayerData) => void,
) => {
  const playNewSermon = usePlayNewSermon()

  const handlePressItem = useCallback(
    async (index: number) => {
      const sermon = list[index]
      if (!sermon.audioUrl) return
      await playNewSermon({ playlist, sermon })
    },
    [list, playNewSermon, playlist],
  )

  const buildMenuActions = useCallback(
    (index: number): MenuItem[] | undefined => {
      const sermon = list[index]
      const audio = sermon ? toAudioPlayerData(sermon) : null
      if (!audio) return undefined
      return buildHistoryMenuActions({
        inHistory: historySermonIds.has(audio.id),
        isCompleted: progressMap.get(audio.id) === 1,
        onAddToPlaylist,
        playlist,
        sermon: audio,
      })
    },
    [historySermonIds, list, onAddToPlaylist, playlist, progressMap],
  )

  const handlePressPlayAll = useCallback(
    async (target?: SermonData) => {
      const sermon = target ?? list.find((s: SermonData) => s.audioUrl)
      if (!sermon) return
      await playNewSermon({ playlist, sermon })
    },
    [list, playNewSermon, playlist],
  )

  return { buildMenuActions, handlePressItem, handlePressPlayAll }
}
