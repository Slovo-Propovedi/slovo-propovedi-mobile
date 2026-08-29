import { memo, useCallback } from 'react'
import { useEntryPlayback } from 'features/entry-playback'
import {
  getEntrySermon,
  type ListeningHistoryEntry,
  removeHistoryEntryAction,
} from 'entities/listening-history'
import { formatRelativeDate } from 'shared/lib/format'
import { ctx } from 'shared/lib/reatom-ctx'
import { INDENTS } from 'shared/ui/theme'
import { type MenuAction, TracksListItem } from 'shared/ui/track-list'

const PLAYBACK_ERROR_MESSAGE = 'Не удалось воспроизвести проповедь из истории'

interface HistoryRowProps {
  entry: ListeningHistoryEntry
  isAudioPlaying: boolean
  isPlaying: boolean
}

export const HistoryRow = memo(({ entry, isAudioPlaying, isPlaying }: HistoryRowProps) => {
  const playEntry = useEntryPlayback(PLAYBACK_ERROR_MESSAGE)
  const sermon = getEntrySermon(entry)

  const storedProgress =
    entry.durationMs > 0 && entry.positionMs > 0
      ? Math.min(entry.positionMs / entry.durationMs, 1)
      : undefined

  const handlePress = useCallback(() => playEntry(entry), [entry, playEntry])

  if (!sermon) return null

  const menuActions: MenuAction[] = [
    {
      icon: 'trash-outline',
      onPress: () => void removeHistoryEntryAction(ctx, sermon.id),
      text: 'Удалить из истории',
    },
  ]

  return (
    <TracksListItem
      title={sermon.title}
      isPlaying={isPlaying}
      onPress={handlePress}
      artwork={sermon.artwork}
      progress={storedProgress}
      menuActions={menuActions}
      audioUrl={sermon.audioUrl}
      isAudioPlaying={isAudioPlaying}
      style={{ marginHorizontal: INDENTS.medium }}
      subtitle={formatRelativeDate(entry.lastPlayedAt)}
    />
  )
})
