import { useCtx } from '@reatom/npm-react'
import { useCallback, useMemo, useState } from 'react'
import {
  markSermonsListenedAction,
  removeSermonsFromHistoryAction,
  useHistoryProgressMap,
  useHistorySermonIds,
} from 'entities/listening-history'
import { type AudioPlayerData, type PlaylistData, toAudioPlayerData } from 'shared/model'

interface PlaylistHistoryFlags {
  canMarkAll: boolean
  canRemoveFromHistory: boolean
}

/**
 * Gating for the playlist header history bulk items.
 *
 * - Mark-all: shown when at least one sermon has playable audio AND is not
 *   completed (completed = inHistory && progress === 1, same invariant as
 *   buildHistoryMenuActions).
 * - Remove-from-history: shown when at least one sermon id is in history —
 *   playability is NOT required (the confirm handler removes ALL sermon ids
 *   regardless of audio).
 * @param playlist - The playlist whose sermons back the bulk items.
 * @param progressMap - Stored listening progress by sermon id (0..1).
 * @param historySermonIds - Sermon ids present in listening history.
 */
export const computePlaylistHistoryFlags = (
  playlist: PlaylistData,
  progressMap: Map<string, number>,
  historySermonIds: Set<string>,
): PlaylistHistoryFlags => {
  let canMarkAll = false
  let canRemoveFromHistory = false

  for (const sermon of playlist.sermons) {
    if (historySermonIds.has(sermon.id)) canRemoveFromHistory = true
    if (!toAudioPlayerData(sermon)) continue
    if (!historySermonIds.has(sermon.id) || progressMap.get(sermon.id) !== 1) canMarkAll = true
  }

  return { canMarkAll, canRemoveFromHistory }
}

export const usePlaylistHistoryMenu = (playlist: PlaylistData, onMenuClose: () => void) => {
  const ctx = useCtx()
  const progressMap = useHistoryProgressMap()
  const historySermonIds = useHistorySermonIds()
  const [markDialogVisible, setMarkDialogVisible] = useState(false)
  const [removeDialogVisible, setRemoveDialogVisible] = useState(false)

  const { canMarkAll, canRemoveFromHistory } = useMemo(
    () => computePlaylistHistoryFlags(playlist, progressMap, historySermonIds),
    [historySermonIds, playlist, progressMap],
  )

  const handleMarkAllOption = useCallback(() => {
    onMenuClose()
    setMarkDialogVisible(true)
  }, [onMenuClose])

  const handleMarkAllConfirm = useCallback(() => {
    setMarkDialogVisible(false)
    const audios = playlist.sermons
      .map(toAudioPlayerData)
      .filter((audio): audio is AudioPlayerData => audio !== null)
    void markSermonsListenedAction(ctx, audios, playlist)
  }, [ctx, playlist])

  const handleRemoveOption = useCallback(() => {
    onMenuClose()
    setRemoveDialogVisible(true)
  }, [onMenuClose])

  const handleRemoveConfirm = useCallback(() => {
    setRemoveDialogVisible(false)
    void removeSermonsFromHistoryAction(
      ctx,
      playlist.sermons.map(s => s.id),
    )
  }, [ctx, playlist])

  return {
    canMarkAll,
    canRemoveFromHistory,
    handleMarkAllConfirm,
    handleMarkAllOption,
    handleRemoveConfirm,
    handleRemoveOption,
    markDialogVisible,
    removeDialogVisible,
    setMarkDialogVisible,
    setRemoveDialogVisible,
  }
}
