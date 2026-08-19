import { memo, useCallback } from 'react'
import {
  type ListeningHistoryEntry,
  removeHistoryEntryAction,
  useSermonProgress,
} from 'entities/listening-history'
import { usePlayNewSermon } from 'entities/player'
import { formatRelativeDate } from 'shared/lib/format'
import { ctx } from 'shared/lib/reatom-ctx'
import { INDENTS } from 'shared/ui/themed'
import { type MenuAction, TracksListItem } from 'shared/ui/track-list'

interface HistoryRowProps {
  entry: ListeningHistoryEntry
  isAudioPlaying: boolean
  isPlaying: boolean
}

export const HistoryRow = memo(({ entry, isAudioPlaying, isPlaying }: HistoryRowProps) => {
  const playNewSermon = usePlayNewSermon()

  const storedProgress =
    entry.durationMs > 0 && entry.positionMs > 0
      ? Math.min(entry.positionMs / entry.durationMs, 1)
      : undefined

  const progress = useSermonProgress(entry.sermon.id, storedProgress)

  const handlePress = useCallback(async () => {
    await playNewSermon({ playlist: entry.playlist, sermon: entry.sermon })
  }, [entry, playNewSermon])

  const menuActions: MenuAction[] = [
    {
      icon: 'trash-outline',
      onPress: () => void removeHistoryEntryAction(ctx, entry.sermon.id),
      text: 'Удалить из истории',
    },
  ]

  return (
    <TracksListItem
      progress={progress}
      isPlaying={isPlaying}
      onPress={handlePress}
      menuActions={menuActions}
      title={entry.sermon.title}
      artwork={entry.sermon.artwork}
      isAudioPlaying={isAudioPlaying}
      audioUrl={entry.sermon.audioUrl}
      style={{ marginHorizontal: INDENTS.medium }}
      subtitle={formatRelativeDate(entry.lastPlayedAt)}
    />
  )
})
