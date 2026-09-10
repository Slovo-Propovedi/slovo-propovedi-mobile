import { memo, useCallback, useMemo } from 'react'
import { StyleSheet } from 'react-native'
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

const styles = StyleSheet.create({
  row: { marginHorizontal: INDENTS.medium },
})

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

  const menuActions = useMemo(() => {
    // Derive the sermon inside the memo: getEntrySermon builds a fresh object
    // for entries without a snapshot sermon, so it must not be a dependency.
    const memoizedSermon = getEntrySermon(entry)
    return memoizedSermon
      ? buildHistoryMenuActions({
          inHistory: true,
          isCompleted: completed,
          playlist: entry.playlist,
          sermon: memoizedSermon,
        })
      : []
  }, [completed, entry])

  if (!sermon) return null

  return (
    <TracksListItem
      style={styles.row}
      title={sermon.title}
      isPlaying={isPlaying}
      onPress={handlePress}
      artwork={sermon.artwork}
      menuActions={menuActions}
      progress={storedProgress}
      audioUrl={sermon.audioUrl}
      isAudioPlaying={isAudioPlaying}
      subtitle={formatRelativeDate(entry.lastPlayedAt)}
    />
  )
})
