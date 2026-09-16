import BottomSheet from '@gorhom/bottom-sheet'
import { useAtom } from '@reatom/npm-react'
import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { useHistoryProgressMap } from 'entities/listening-history'
import { currentAudioAtom, isPlayingAtom } from 'entities/player'
import { cacheUpdateTriggerAtom } from 'shared/lib/cache-triggers'
import { useTheme } from 'shared/ui/theme'
import type { PlaylistData } from 'shared/model'
import { createStyles } from './PlaylistBottomSheet.styles'
import { PlaylistSheetBackdrop } from './PlaylistSheetBackdrop'
import { PlaylistSheetContent } from './PlaylistSheetContent'
import { useListReveal } from './useListReveal'
import { FINAL_SNAP_INDEX, useQueueSheetSnapMetrics } from './useQueueSheetSnapMetrics'
import { useScrollToCurrentTrack } from './useScrollToCurrentTrack'
import { useSheetLifecycle } from './useSheetLifecycle'

interface PlaylistBottomSheetProps {
  closeOnBack?: boolean
  onClose: () => void
  playlist: null | PlaylistData
  sheetRef: React.RefObject<BottomSheet | null>
}

const PlaylistBottomSheetComponent = ({
  closeOnBack = true,
  onClose,
  playlist,
  sheetRef,
}: PlaylistBottomSheetProps) => {
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
  // User touch = show the real list immediately; the auto-scroll retries stop
  // fighting the finger (scrollGuards drops them while dragging/flinging).
  const handleDragStartWithReveal = useCallback(() => {
    revealNow()
    handleDragStart()
  }, [handleDragStart, revealNow])
  const handleMomentumStartWithReveal = useCallback(() => {
    revealNow()
    handleMomentumStart()
  }, [handleMomentumStart, revealNow])
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
        currentAudioId={currentAudio?.id}
        onMomentumEnd={handleMomentumEnd}
        onDragStart={handleDragStartWithReveal}
        initialNumToRender={initialNumToRender}
        onMomentumStart={handleMomentumStartWithReveal}
        onScrollToIndexFailed={handleScrollToIndexFailed}
      />
    </BottomSheet>
  )
}
export const PlaylistBottomSheet = memo(PlaylistBottomSheetComponent)
