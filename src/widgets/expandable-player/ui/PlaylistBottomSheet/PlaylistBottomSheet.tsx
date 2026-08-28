import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { useAtom } from '@reatom/npm-react'
import { memo, useCallback, useMemo } from 'react'
import { Text } from 'react-native'
import { useHistoryProgressMap } from 'entities/listening-history'
import {
  currentAudioAtom,
  downloadingAudioUrlAtom,
  isPlayingAtom,
  usePlayNewSermon,
} from 'entities/player'
import { cacheUpdateTriggerAtom } from 'shared/lib/cache-triggers'
import { useTheme } from 'shared/ui/theme'
import type { PlaylistData } from 'shared/model'
import { createStyles } from './PlaylistBottomSheet.styles'
import { PlaylistSheetList } from './PlaylistSheetList'
import { useListReveal } from './useListReveal'
import { useScrollToCurrentTrack } from './useScrollToCurrentTrack'

const SNAP_POINTS: (number | string)[] = ['50%', '80%']
const FINAL_SNAP_INDEX = SNAP_POINTS.length - 1

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
  const playNewSermon = usePlayNewSermon()
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

  const handlePressItem = useCallback(
    async (index: number) => {
      if (!playlist) return
      const sermon = playlist.sermons[index]
      if (!sermon.audioUrl) return

      await playNewSermon({ playlist, sermon })
      sheetRef.current?.close()
      onClose()
    },
    [playlist, playNewSermon, sheetRef, onClose],
  )
  const handleSheetChanges = useCallback(
    (index: number) => {
      noteSheetIndex(index)
      if (index === FINAL_SNAP_INDEX) {
        scrollToCurrent()
        noteScrollScheduled()
      }
      if (closeOnBack && index === -1) onClose()
    },
    [closeOnBack, noteSheetIndex, noteScrollScheduled, onClose, scrollToCurrent],
  )
  const renderStyles = useMemo(() => createStyles(currentTheme), [currentTheme])

  if (!playlist) return null

  return (
    <BottomSheet
      ref={sheetRef}
      enablePanDownToClose
      index={FINAL_SNAP_INDEX}
      snapPoints={SNAP_POINTS}
      enableDynamicSizing={false}
      onChange={handleSheetChanges}
      backgroundStyle={renderStyles.background}
      handleIndicatorStyle={renderStyles.indicator}
      backdropComponent={props => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          pressBehavior='close'
          disappearsOnIndex={-1}
        />
      )}
    >
      <Text style={renderStyles.title}>{playlist.title}</Text>
      <PlaylistSheetList
        listRef={listRef}
        playlist={playlist}
        styles={renderStyles}
        isRevealed={isRevealed}
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
