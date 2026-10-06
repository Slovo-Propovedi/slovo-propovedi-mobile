import { type PlaylistData } from 'entities/playlist/@x/listening-history'
import { type AudioPlayerData } from 'entities/sermon/@x/listening-history'
import { ctx } from 'shared/lib/reatom-ctx'
import { type MenuItem } from 'shared/ui/menu'
import { markSermonListenedAction } from './markSermonListened'
import { removeHistoryEntryAction } from './removeHistoryEntry'

interface BuildHistoryMenuActionsParams {
  inHistory: boolean
  /** Completion flag — honored only when `inHistory === true`. */
  isCompleted: boolean
  /** Opens the add-to-playlist modal for the row's sermon. */
  onAddToPlaylist?: (sermon: AudioPlayerData) => void
  playlist?: PlaylistData
  sermon: AudioPlayerData
}

const ADD_TO_PLAYLIST_TEXT = 'Добавить в плейлист'

export const buildHistoryMenuActions = ({
  inHistory,
  isCompleted,
  onAddToPlaylist,
  playlist,
  sermon,
}: BuildHistoryMenuActionsParams): MenuItem[] => {
  // Invariant: completion without a history entry is an impossible state by
  // design — only an in-history row can be marked completed.
  const completed = inHistory && isCompleted

  const actions: MenuItem[] = []

  if (onAddToPlaylist)
    actions.push({
      icon: 'add-circle',
      onPress: () => onAddToPlaylist(sermon),
      text: ADD_TO_PLAYLIST_TEXT,
    })

  if (!completed)
    actions.push({
      icon: 'checkmark-done',
      onPress: () => void markSermonListenedAction(ctx, sermon, playlist),
      text: 'Пометить прослушанной',
    })

  if (inHistory)
    actions.push({
      icon: 'time-outline',
      onPress: () => void removeHistoryEntryAction(ctx, sermon.id),
      text: 'Удалить из истории',
    })

  return actions
}
