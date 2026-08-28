import { type BottomSheetFlatListMethods } from '@gorhom/bottom-sheet'
import { memo, useCallback, useMemo } from 'react'
import { View } from 'react-native'
import { formatSermonReference } from 'shared/lib/format'
import type { PlaylistData } from 'shared/model'
import { type createStyles } from './PlaylistBottomSheet.styles'
import { PlaylistSheetRow } from './PlaylistSheetRow'
import { PlaylistSheetSkeleton } from './PlaylistSheetSkeleton'
import { ScrollableSheetList } from './ScrollableSheetList'

interface PlaylistSheetListProps {
  cacheTrigger: number
  currentAudioId?: string
  downloadingUrl?: null | string
  initialNumToRender?: number
  isAudioPlaying: boolean
  isRevealed: boolean
  listRef: React.RefObject<BottomSheetFlatListMethods | null>
  onDragEnd: () => void
  onDragStart: () => void
  onMomentumEnd: () => void
  onMomentumStart: () => void
  onPress: (index: number) => void
  onScroll: (y: number) => void
  onScrollToIndexFailed: (info: { averageItemLength: number; index: number }) => void
  playlist: PlaylistData
  progressMap: Map<string, number>
  styles: ReturnType<typeof createStyles>
}

interface TrackListItemData {
  artwork?: null | string
  id: string
  subtitle?: string
  title: string
  url?: string
}

const keyExtractor = (item: TrackListItemData) => item.id

const PlaylistSheetListComponent = ({
  cacheTrigger,
  currentAudioId,
  downloadingUrl,
  initialNumToRender,
  isAudioPlaying,
  isRevealed,
  listRef,
  onDragEnd,
  onDragStart,
  onMomentumEnd,
  onMomentumStart,
  onPress,
  onScroll,
  onScrollToIndexFailed,
  playlist,
  progressMap,
  styles,
}: PlaylistSheetListProps) => {
  const tracksListData = useMemo<TrackListItemData[]>(
    () =>
      playlist.sermons.map(sermon => ({
        artwork: playlist.artwork,
        id: sermon.id,
        subtitle: formatSermonReference({
          book: sermon.book,
          chapter: sermon.chapter,
          verse: sermon.verse,
        }),
        title: sermon.title,
        url: sermon.audioUrl ?? undefined,
      })),
    [playlist],
  )

  const renderItem = useCallback(
    ({ index, item }: { index: number; item: TrackListItemData }) => (
      <PlaylistSheetRow
        index={index}
        onPress={onPress}
        title={item.title}
        audioUrl={item.url}
        artwork={item.artwork}
        subtitle={item.subtitle}
        cacheTrigger={cacheTrigger}
        downloadingUrl={downloadingUrl}
        isPlaying={currentAudioId === item.id}
        storedProgress={progressMap.get(item.id)}
        isAudioPlaying={currentAudioId === item.id && isAudioPlaying}
      />
    ),
    [cacheTrigger, currentAudioId, downloadingUrl, isAudioPlaying, onPress, progressMap],
  )
  const ItemSeparator = useCallback(() => <View style={styles.divider} />, [styles])

  return (
    <View style={styles.listWrapper}>
      <ScrollableSheetList
        ref={listRef}
        data={tracksListData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onScrollEndDrag={onDragEnd}
        onScrollBeginDrag={onDragStart}
        onMomentumScrollEnd={onMomentumEnd}
        ItemSeparatorComponent={ItemSeparator}
        initialNumToRender={initialNumToRender}
        onMomentumScrollBegin={onMomentumStart}
        onScrollToIndexFailed={onScrollToIndexFailed}
        contentContainerStyle={[styles.listContent, !isRevealed && styles.hiddenContent]}
        // Per-frame native→JS dispatch is only needed until the landing signal arrives.
        onScroll={isRevealed ? undefined : event => onScroll(event.nativeEvent.contentOffset.y)}
      />
      {!isRevealed && <PlaylistSheetSkeleton styles={styles} />}
    </View>
  )
}

export const PlaylistSheetList = memo(PlaylistSheetListComponent)
