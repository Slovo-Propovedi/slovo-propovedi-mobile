import { type BottomSheetFlatListMethods } from '@gorhom/bottom-sheet'
import { memo } from 'react'
import { View } from 'react-native'
import { TracksListSkeleton } from 'shared/ui/track-list'
import type { PlaylistData } from 'shared/model'
import { type createStyles } from './PlaylistBottomSheet.styles'
import { ScrollableSheetList } from './ScrollableSheetList'
import { type TrackListItemData, usePlaylistSheetList } from './usePlaylistSheetList'

const SKELETON_ROWS_COUNT = 8

interface PlaylistSheetListProps {
  cacheTrigger: number
  currentAudioId?: string
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
  settleTick: number
  sheetTop: number
  styles: ReturnType<typeof createStyles>
}
const keyExtractor = (item: TrackListItemData) => item.id

// eslint-disable-next-line react-refresh/only-export-components -- Skeleton is attached via composition API
const PlaylistSheetListComponent = ({
  cacheTrigger,
  currentAudioId,
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
  settleTick,
  sheetTop,
  styles,
}: PlaylistSheetListProps) => {
  const {
    footerHeight,
    handleContentSizeChange,
    handleScrollEvent,
    handleWrapperLayout,
    ItemSeparator,
    maxListHeight,
    renderItem,
    tracksListData,
    wrapperRef,
  } = usePlaylistSheetList({
    cacheTrigger,
    currentAudioId,
    isAudioPlaying,
    onPress,
    onScroll,
    playlist,
    progressMap,
    settleTick,
    sheetTop,
    styles,
  })

  return (
    <View
      ref={wrapperRef}
      onLayout={handleWrapperLayout}
      style={[styles.listWrapper, maxListHeight !== null && { maxHeight: maxListHeight }]}
    >
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
        onContentSizeChange={handleContentSizeChange}
        onScroll={isRevealed ? undefined : handleScrollEvent}
        contentContainerStyle={[styles.listContent, !isRevealed && styles.hiddenContent]}
        ListFooterComponent={<View pointerEvents='none' style={{ height: footerHeight }} />}
      />
      {!isRevealed && (
        <View pointerEvents='none' testID='playlist-skeleton' style={styles.skeletonOverlay}>
          <PlaylistSheetList.Skeleton rowCount={SKELETON_ROWS_COUNT} />
        </View>
      )}
    </View>
  )
}

export const PlaylistSheetList = Object.assign(memo(PlaylistSheetListComponent), {
  Skeleton: TracksListSkeleton,
})
