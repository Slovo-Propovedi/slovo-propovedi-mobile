import { memo, useCallback, useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { useEntryPlayback } from 'features/entry-playback'
import {
  buildHistoryMenuActions,
  getEntrySermon,
  isEntryCompleted,
  type ListeningHistoryEntry,
} from 'entities/listening-history'
import { useTrackItemCache } from 'entities/offline-cache'
import { type SermonData } from 'entities/sermon'
import { TracksListItem } from 'entities/track-list'
import { formatRelativeDate } from 'shared/lib/format'
import { INDENTS } from 'shared/ui/theme'

const PLAYBACK_ERROR_MESSAGE = 'Не удалось воспроизвести проповедь из истории'

const styles = StyleSheet.create({
  row: { marginHorizontal: INDENTS.medium },
})

export const HistoryRow = memo(
  ({
    entry,
    isAudioPlaying,
    isPlaying,
    onAddToPlaylist,
  }: {
    entry: ListeningHistoryEntry
    isAudioPlaying: boolean
    isPlaying: boolean
    onAddToPlaylist?: (sermon: SermonData) => void
  }) => {
    const playEntry = useEntryPlayback(PLAYBACK_ERROR_MESSAGE)
    const sermon = getEntrySermon(entry)
    const cacheState = useTrackItemCache(sermon?.audioUrl)
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
            onAddToPlaylist,
            playlist: entry.playlist,
            sermon: memoizedSermon,
          })
        : []
    }, [completed, entry, onAddToPlaylist])

    if (!sermon) return null

    return (
      <TracksListItem
        style={styles.row}
        title={sermon.title}
        isPlaying={isPlaying}
        onPress={handlePress}
        cacheState={cacheState}
        artwork={sermon.artwork}
        menuActions={menuActions}
        progress={storedProgress}
        audioUrl={sermon.audioUrl}
        isAudioPlaying={isAudioPlaying}
        subtitle={formatRelativeDate(entry.lastPlayedAt)}
      />
    )
  },
)
