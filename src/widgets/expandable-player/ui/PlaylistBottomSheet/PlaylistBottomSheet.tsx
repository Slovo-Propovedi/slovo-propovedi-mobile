import BottomSheet from '@gorhom/bottom-sheet'
import { useAtom } from '@reatom/npm-react'
import { memo, useMemo, useState } from 'react'
import { useHistoryProgressMap } from 'entities/listening-history'
import { currentAudioAtom, downloadingAudioUrlAtom, isPlayingAtom } from 'entities/player'
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
  const [downloadingUrl] = useAtom(downloadingAudioUrlAtom)
  const [isAudioPlaying] = useAtom(isPlayingAtom)
  const [cacheTrigger] = useAtom(cacheUpdateTriggerAtom)
  const [settleTick, setSettleTick] = useState(0)
  const progressMap = useHistoryProgressMap()
  const { currentTheme } = useTheme()
  const {
    currentIndex,
    handleDragEnd,
    handleDragStart,
    handleMomentumEnd,
    handleMomentumStart,
    handleScrollToIndexFailed,
    initialNumToRender,
    listRef,
    noteSheetIndex,
    scrollToCurrent,
  } = useScrollToCurrentTrack({
    currentAudio,
    finalSnapIndex: FINAL_SNAP_INDEX,
    playlist,
  })
  const { handleListScroll, isRevealed, noteScrollScheduled } = useListReveal({ currentIndex })
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
        onDragStart={handleDragStart}
        downloadingUrl={downloadingUrl}
        isAudioPlaying={isAudioPlaying}
        currentAudioId={currentAudio?.id}
        onMomentumEnd={handleMomentumEnd}
        onMomentumStart={handleMomentumStart}
        initialNumToRender={initialNumToRender}
        onScrollToIndexFailed={handleScrollToIndexFailed}
      />
    </BottomSheet>
  )
}
export const PlaylistBottomSheet = memo(PlaylistBottomSheetComponent)
