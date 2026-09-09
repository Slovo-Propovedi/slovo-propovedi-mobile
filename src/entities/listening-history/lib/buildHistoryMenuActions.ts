import { ctx } from 'shared/lib/reatom-ctx'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { type MenuAction } from 'shared/ui/track-list'
import { markSermonListenedAction } from './markSermonListened'
import { removeHistoryEntryAction } from './removeHistoryEntry'

interface BuildHistoryMenuActionsParams {
  inHistory: boolean
  /** Completion flag — honored only when `inHistory === true`. */
  isCompleted: boolean
  playlist?: PlaylistData
  sermon: AudioPlayerData
}

export const buildHistoryMenuActions = ({
  inHistory,
  isCompleted,
  playlist,
  sermon,
}: BuildHistoryMenuActionsParams): MenuAction[] => {
  // Invariant: completion without a history entry is an impossible state by
  // design — only an in-history row can be marked completed.
  const completed = inHistory && isCompleted

  const actions: MenuAction[] = []

  if (!completed)
    actions.push({
      icon: 'checkmark-done',
      onPress: () => void markSermonListenedAction(ctx, sermon, playlist),
      text: 'Пометить прослушанной',
    })

  if (inHistory)
    actions.push({
      icon: 'trash-outline',
      onPress: () => void removeHistoryEntryAction(ctx, sermon.id),
      text: 'Удалить из истории',
    })

  return actions
}
