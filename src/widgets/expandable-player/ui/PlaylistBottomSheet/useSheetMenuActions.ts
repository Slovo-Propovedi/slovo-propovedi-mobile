import { useCallback, useMemo, useRef } from 'react'
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
  // Per-id cache: rows re-render on unrelated state (cacheTrigger, other rows'
  // progress) and would rebuild their menu actions every time. The cache is
  // cleared synchronously when any dependency changes, so stale entries never
  // leak into a render.
  const actionsCacheRef = useRef(new Map<string, MenuAction[] | undefined>())
  const cacheDepsRef = useRef<readonly unknown[]>([])

  return useCallback(
    (itemId: string): MenuAction[] | undefined => {
      const deps: readonly unknown[] = [historySermonIds, playlist, progressMap, sermonById]
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
            playlist,
            sermon: audio,
          })
        : undefined
      actionsCacheRef.current.set(itemId, actions)
      return actions
    },
    [historySermonIds, playlist, progressMap, sermonById],
  )
}
