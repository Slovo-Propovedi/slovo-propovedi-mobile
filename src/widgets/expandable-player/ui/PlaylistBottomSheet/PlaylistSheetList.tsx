import { type BottomSheetFlatListMethods } from '@gorhom/bottom-sheet'
import { memo } from 'react'
import { View } from 'react-native'
import type { PlaylistData } from 'shared/model'
import { type createStyles } from './PlaylistBottomSheet.styles'
import { PlaylistSheetSkeleton } from './PlaylistSheetSkeleton'
import { ScrollableSheetList } from './ScrollableSheetList'
import { type TrackListItemData, usePlaylistSheetList } from './usePlaylistSheetList'

interface PlaylistSheetListProps {
  cacheTrigger: number
  currentAudioId?: string
  downloadingUrl?: null | string
  hiddenBelowSheetEdge: number
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
const keyExtractor = (item: TrackListItemData) => item.id
const PlaylistSheetListComponent = ({
  cacheTrigger,
  currentAudioId,
  downloadingUrl,
  hiddenBelowSheetEdge,
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
  const {
    footerHeight,
    handleContentSizeChange,
    handleListLayout,
    handleScrollEvent,
    ItemSeparator,
    renderItem,
    tracksListData,
  } = usePlaylistSheetList({
    cacheTrigger,
    currentAudioId,
    downloadingUrl,
    hiddenBelowSheetEdge,
    isAudioPlaying,
    onPress,
    onScroll,
    playlist,
    progressMap,
    styles,
  })
  return (
    <View style={styles.listWrapper}>
      <ScrollableSheetList
        ref={listRef}
        data={tracksListData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onScrollEndDrag={onDragEnd}
        onLayout={handleListLayout}
        onScrollBeginDrag={onDragStart}
        onMomentumScrollEnd={onMomentumEnd}
        ItemSeparatorComponent={ItemSeparator}
        initialNumToRender={initialNumToRender}
        onMomentumScrollBegin={onMomentumStart}
        onScrollToIndexFailed={onScrollToIndexFailed}
        onContentSizeChange={handleContentSizeChange}
        // Per-frame native→JS dispatch is only needed until the landing signal arrives.
        onScroll={isRevealed ? undefined : handleScrollEvent}
        contentContainerStyle={[styles.listContent, !isRevealed && styles.hiddenContent]}
        ListFooterComponent={<View pointerEvents='none' style={{ height: footerHeight }} />}
      />
      {!isRevealed && <PlaylistSheetSkeleton styles={styles} />}
    </View>
  )
}

export const PlaylistSheetList = memo(PlaylistSheetListComponent)
