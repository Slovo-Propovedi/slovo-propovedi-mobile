import { useCallback, useMemo, useRef } from 'react'
import { buildHistoryMenuActions, useHistorySermonIds } from 'entities/listening-history'
import { type PlaylistData } from 'entities/playlist'
import { type AudioPlayerData, toAudioPlayerData } from 'entities/sermon'
import { type MenuItem } from 'shared/ui/menu'

/**
 * Builds per-row context-menu actions for the queue sheet.
 *
 * Rows resolve full sermon data from the playlist; rows without playable
 * audio never open the menu (TracksListItem gates on audioUrl), so the
 * builder is only reached for playable sermons.
 * @param playlist - The queue playlist whose sermons back the rows.
 * @param progressMap - Stored listening progress by sermon id (0..1).
 * @param onAddToPlaylist - Opens the add-to-playlist modal for a sermon.
 */
export const useSheetMenuActions = (
  playlist: PlaylistData,
  progressMap: Map<string, number>,
  onAddToPlaylist?: (sermon: AudioPlayerData) => void,
): ((itemId: string) => MenuItem[] | undefined) => {
  const historySermonIds = useHistorySermonIds()
  const sermonById = useMemo(
    () => new Map(playlist.sermons.map(sermon => [sermon.id, sermon] as const)),
    [playlist],
  )
  // Per-id cache: rows re-render on unrelated state (cacheTrigger, other rows'
  // progress) and would rebuild their menu actions every time. The cache is
  // cleared synchronously when any dependency changes, so stale entries never
  // leak into a render.
  const actionsCacheRef = useRef(new Map<string, MenuItem[] | undefined>())
  const cacheDepsRef = useRef<readonly unknown[]>([])

  return useCallback(
    (itemId: string): MenuItem[] | undefined => {
      const deps: readonly unknown[] = [
        historySermonIds,
        onAddToPlaylist,
        playlist,
        progressMap,
        sermonById,
      ]
      const prevDeps = cacheDepsRef.current
      if (prevDeps.length !== deps.length || deps.some((dep, i) => dep !== prevDeps[i])) {
        actionsCacheRef.current.clear()
        cacheDepsRef.current = deps
      }
      if (actionsCacheRef.current.has(itemId)) return actionsCacheRef.current.get(itemId)
      const sermon = sermonById.get(itemId)
      const audio = sermon ? toAudioPlayerData(sermon) : null
      const actions = audio
        ? buildHistoryMenuActions({
            inHistory: historySermonIds.has(itemId),
            isCompleted: progressMap.get(itemId) === 1,
            onAddToPlaylist,
            playlist,
            sermon: audio,
          })
        : undefined
      actionsCacheRef.current.set(itemId, actions)
      return actions
    },
    [historySermonIds, onAddToPlaylist, playlist, progressMap, sermonById],
  )
}
