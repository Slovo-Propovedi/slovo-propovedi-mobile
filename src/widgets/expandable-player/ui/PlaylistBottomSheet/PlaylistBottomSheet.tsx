import BottomSheet from '@gorhom/bottom-sheet'
import { useAtom } from '@reatom/npm-react'
import { type ComponentType, memo, useMemo, useRef, useState } from 'react'
import { useHistoryProgressMap } from 'entities/listening-history'
import { cacheUpdateTriggerAtom } from 'entities/offline-cache'
import { currentAudioAtom, isPlayingAtom } from 'entities/player'
import { type PlaylistData } from 'entities/playlist'
import { type AudioPlayerData } from 'entities/sermon'
import { useTheme } from 'shared/ui/theme'
import { FINAL_SNAP_INDEX } from '../../lib/useSheetSnapMetrics'
import { createStyles } from './PlaylistBottomSheet.styles'
import { PlaylistSheetBackdrop } from './PlaylistSheetBackdrop'
import { PlaylistSheetContent } from './PlaylistSheetContent'
import { useListReveal } from './useListReveal'
import { useQueueSheetSnapMetrics } from './useQueueSheetSnapMetrics'
import { useRevealGestureHandlers } from './useRevealGestureHandlers'
import { useScrollToCurrentTrack } from './useScrollToCurrentTrack'
import { useSheetLifecycle } from './useSheetLifecycle'

export type PlaylistMenuSlot = ComponentType<{ playlist: PlaylistData }>

const PlaylistBottomSheetComponent = ({
  closeOnBack = true,
  onAddToPlaylist,
  onClose,
  playlist,
  playlistMenuComponent,
  sheetRef,
}: {
  closeOnBack?: boolean
  onAddToPlaylist?: (sermon: AudioPlayerData) => void
  onClose: () => void
  playlist: null | PlaylistData
  playlistMenuComponent?: PlaylistMenuSlot
  sheetRef: React.RefObject<BottomSheet | null>
}) => {
  const [currentAudio] = useAtom(currentAudioAtom)
  const [isAudioPlaying] = useAtom(isPlayingAtom)
  const [cacheTrigger] = useAtom(cacheUpdateTriggerAtom)
  const [settleTick, setSettleTick] = useState(0)
  const progressMap = useHistoryProgressMap()
  const { currentTheme } = useTheme()
  // Shared with the scroll pipeline: the estimate jump's target offset, used
  // by the reveal gate to detect scroll convergence (see useListReveal).
  const intendedOffsetRef = useRef<null | number>(null)
  const {
    currentIndex,
    handleDragEnd,
    handleDragStart,
    handleMomentumEnd,
    handleMomentumStart,
    handleScrollToIndexFailed,
    hasPendingScroll,
    initialNumToRender,
    listRef,
    noteSheetIndex,
    scrollToCurrent,
  } = useScrollToCurrentTrack({
    currentAudio,
    finalSnapIndex: FINAL_SNAP_INDEX,
    intendedOffsetRef,
    playlist,
  })
  const { handleListScroll, isRevealed, noteScrollScheduled, revealNow } = useListReveal({
    currentIndex,
    hasPendingScroll,
    intendedOffsetRef,
  })
  const { handleDragStartWithReveal, handleMomentumStartWithReveal } = useRevealGestureHandlers({
    handleDragStart,
    handleMomentumStart,
    revealNow,
  })
  const { handleAnimate, handlePressItem, handleSheetChanges, sheetIndex } = useSheetLifecycle({
    closeOnBack,
    noteScrollScheduled,
    noteSheetIndex,
    onClose,
    onSheetSettled: () => setSettleTick(t => t + 1),
    playlist,
    scrollToCurrent,
    sheetRef,
  })

  const { sheetTop, snapPoints } = useQueueSheetSnapMetrics({ sheetIndex })
  const renderStyles = useMemo(() => createStyles(currentTheme), [currentTheme])

  if (!playlist) return null

  return (
    <BottomSheet
      ref={sheetRef}
      enablePanDownToClose
      snapPoints={snapPoints}
      index={FINAL_SNAP_INDEX}
      onAnimate={handleAnimate}
      enableDynamicSizing={false}
      onChange={handleSheetChanges}
      enableContentPanningGesture={false}
      backgroundStyle={renderStyles.background}
      backdropComponent={PlaylistSheetBackdrop}
      handleIndicatorStyle={renderStyles.indicator}
    >
      <PlaylistSheetContent
        listRef={listRef}
        playlist={playlist}
        sheetTop={sheetTop}
        styles={renderStyles}
        isRevealed={isRevealed}
        settleTick={settleTick}
        onPress={handlePressItem}
        progressMap={progressMap}
        onDragEnd={handleDragEnd}
        cacheTrigger={cacheTrigger}
        onScroll={handleListScroll}
        isAudioPlaying={isAudioPlaying}
        onAddToPlaylist={onAddToPlaylist}
        currentAudioId={currentAudio?.id}
        onMomentumEnd={handleMomentumEnd}
        onDragStart={handleDragStartWithReveal}
        initialNumToRender={initialNumToRender}
        playlistMenuComponent={playlistMenuComponent}
        onMomentumStart={handleMomentumStartWithReveal}
        onScrollToIndexFailed={handleScrollToIndexFailed}
      />
    </BottomSheet>
  )
}
export const PlaylistBottomSheet = memo(PlaylistBottomSheetComponent)
