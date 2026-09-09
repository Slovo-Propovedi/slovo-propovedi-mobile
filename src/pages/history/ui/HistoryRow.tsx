import { memo, useCallback } from 'react'
import { useEntryPlayback } from 'features/entry-playback'
import {
  buildHistoryMenuActions,
  getEntrySermon,
  isEntryCompleted,
  type ListeningHistoryEntry,
} from 'entities/listening-history'
import { formatRelativeDate } from 'shared/lib/format'
import { INDENTS } from 'shared/ui/theme'
import { TracksListItem } from 'shared/ui/track-list'

const PLAYBACK_ERROR_MESSAGE = 'Не удалось воспроизвести проповедь из истории'

interface HistoryRowProps {
  entry: ListeningHistoryEntry
  isAudioPlaying: boolean
  isPlaying: boolean
}

export const HistoryRow = memo(({ entry, isAudioPlaying, isPlaying }: HistoryRowProps) => {
  const playEntry = useEntryPlayback(PLAYBACK_ERROR_MESSAGE)
  const sermon = getEntrySermon(entry)
  const completed = isEntryCompleted(entry)

  const storedProgress = completed
    ? 1
    : entry.durationMs > 0 && entry.positionMs > 0
      ? Math.min(entry.positionMs / entry.durationMs, 1)
      : undefined

  const handlePress = useCallback(() => playEntry(entry), [entry, playEntry])

  if (!sermon) return null

  const menuActions = buildHistoryMenuActions({
    inHistory: true,
    isCompleted: completed,
    playlist: entry.playlist,
    sermon,
  })

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
