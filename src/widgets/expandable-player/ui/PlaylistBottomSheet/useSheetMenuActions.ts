import { useCallback, useMemo } from 'react'
import { buildHistoryMenuActions, useHistorySermonIds } from 'entities/listening-history'
import { type PlaylistData, toAudioPlayerData } from 'shared/model'
import { type MenuAction } from 'shared/ui/track-list'

/**
 * Builds per-row context-menu actions for the queue sheet.
 *
 * Rows resolve full sermon data from the playlist; rows without playable
 * audio never open the menu (TracksListItem gates on audioUrl), so the
 * builder is only reached for playable sermons.
 * @param playlist - The queue playlist whose sermons back the rows.
 * @param progressMap - Stored listening progress by sermon id (0..1).
 */
export const useSheetMenuActions = (
  playlist: PlaylistData,
  progressMap: Map<string, number>,
): ((itemId: string) => MenuAction[] | undefined) => {
  const historySermonIds = useHistorySermonIds()
  const sermonById = useMemo(
    () => new Map(playlist.sermons.map(sermon => [sermon.id, sermon] as const)),
    [playlist],
  )

  return useCallback(
    (itemId: string): MenuAction[] | undefined => {
      const sermon = sermonById.get(itemId)
      const audio = sermon ? toAudioPlayerData(sermon) : null
      if (audio)
        return buildHistoryMenuActions({
          inHistory: historySermonIds.has(itemId),
          isCompleted: progressMap.get(itemId) === 1,
          playlist,
          sermon: audio,
        })

      return undefined
    },
    [historySermonIds, playlist, progressMap, sermonById],
  )
}
