import { type PlaylistData } from 'entities/playlist/@x/listening-history'
import { ctx } from 'shared/lib/reatom-ctx'
import { type MenuItem } from 'shared/ui/menu'
import type { AudioPlayerData } from 'entities/sermon'
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
}: BuildHistoryMenuActionsParams): MenuItem[] => {
  // Invariant: completion without a history entry is an impossible state by
  // design — only an in-history row can be marked completed.
  const completed = inHistory && isCompleted

  const actions: MenuItem[] = []

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
