import { type BottomSheetFlatListMethods } from '@gorhom/bottom-sheet'
import { memo } from 'react'
import { Text } from 'react-native'
import type { PlaylistData } from 'shared/model'
import { type createStyles } from './PlaylistBottomSheet.styles'
import { PlaylistSheetList } from './PlaylistSheetList'

interface PlaylistSheetContentProps {
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

// The sheet's inner composition: the playlist title above the track list.
export const PlaylistSheetContent = memo(
  ({
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
  }: PlaylistSheetContentProps) => (
    <>
      <Text style={styles.title}>{playlist.title}</Text>
      <PlaylistSheetList
        styles={styles}
        listRef={listRef}
        onPress={onPress}
        playlist={playlist}
        onScroll={onScroll}
        onDragEnd={onDragEnd}
        isRevealed={isRevealed}
        progressMap={progressMap}
        onDragStart={onDragStart}
        cacheTrigger={cacheTrigger}
        onMomentumEnd={onMomentumEnd}
        downloadingUrl={downloadingUrl}
        isAudioPlaying={isAudioPlaying}
        currentAudioId={currentAudioId}
        onMomentumStart={onMomentumStart}
        initialNumToRender={initialNumToRender}
        hiddenBelowSheetEdge={hiddenBelowSheetEdge}
        onScrollToIndexFailed={onScrollToIndexFailed}
      />
    </>
  ),
)
