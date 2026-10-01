import { type BottomSheetFlatListMethods } from '@gorhom/bottom-sheet'
import { memo } from 'react'
import { Text, View } from 'react-native'
import { type PlaylistData } from 'entities/playlist'
import { type AudioPlayerData } from 'entities/sermon'
import { type PlaylistMenuSlot } from './PlaylistBottomSheet'
import { type createStyles } from './PlaylistBottomSheet.styles'
import { PlaylistSheetList } from './PlaylistSheetList'

// The sheet's inner composition: a header row (playlist title plus the optional
// injected header menu) above the track list.
export const PlaylistSheetContent = memo(
  ({
    cacheTrigger,
    currentAudioId,
    initialNumToRender,
    isAudioPlaying,
    isRevealed,
    listRef,
    onAddToPlaylist,
    onDragEnd,
    onDragStart,
    onMomentumEnd,
    onMomentumStart,
    onPress,
    onScroll,
    onScrollToIndexFailed,
    playlist,
    playlistMenuComponent: PlaylistMenuComponent,
    progressMap,
    settleTick,
    sheetTop,
    styles,
  }: {
    cacheTrigger: number
    currentAudioId?: string
    initialNumToRender?: number
    isAudioPlaying: boolean
    isRevealed: boolean
    listRef: React.RefObject<BottomSheetFlatListMethods | null>
    onAddToPlaylist?: (sermon: AudioPlayerData) => void
    onDragEnd: () => void
    onDragStart: () => void
    onMomentumEnd: () => void
    onMomentumStart: () => void
    onPress: (index: number) => void
    onScroll: (y: number) => void
    onScrollToIndexFailed: (info: { averageItemLength: number; index: number }) => void
    playlist: PlaylistData
    playlistMenuComponent?: PlaylistMenuSlot
    progressMap: Map<string, number>
    settleTick: number
    sheetTop: number
    styles: ReturnType<typeof createStyles>
  }) => (
    <>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{playlist.title}</Text>
        {PlaylistMenuComponent ? <PlaylistMenuComponent playlist={playlist} /> : null}
      </View>
      <PlaylistSheetList
        styles={styles}
        listRef={listRef}
        onPress={onPress}
        playlist={playlist}
        onScroll={onScroll}
        sheetTop={sheetTop}
        onDragEnd={onDragEnd}
        isRevealed={isRevealed}
        settleTick={settleTick}
        progressMap={progressMap}
        onDragStart={onDragStart}
        cacheTrigger={cacheTrigger}
        onMomentumEnd={onMomentumEnd}
        isAudioPlaying={isAudioPlaying}
        currentAudioId={currentAudioId}
        onAddToPlaylist={onAddToPlaylist}
        onMomentumStart={onMomentumStart}
        initialNumToRender={initialNumToRender}
        onScrollToIndexFailed={onScrollToIndexFailed}
      />
    </>
  ),
)
