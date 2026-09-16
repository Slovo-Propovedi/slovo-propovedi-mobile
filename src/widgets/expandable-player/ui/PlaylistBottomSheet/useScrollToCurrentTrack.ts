import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ScrollToIndexFailedInfo } from './scrollGuards'
import type { AudioPlayerData, PlaylistData } from 'shared/model'
import { scheduleEstimateRetry } from './scrollGuards'
import { createScrollScheduler } from './scrollScheduler'
import { isOffsetNegligible } from './useListReveal'
import { useScrollGuards } from './useScrollGuards'

const MAX_SCROLL_RETRIES = 6
const RETRY_BASE_DELAY_MS = 100
// The skeleton hides scroll convergence; the estimate+retry fallback lands
// exact. The initial window stays mounted forever, so keep it small.
const INITIAL_NUM_TO_RENDER = 10

interface UseScrollToCurrentTrackParams {
  currentAudio: AudioPlayerData | null
  finalSnapIndex: number
  intendedOffsetRef: React.RefObject<null | number>
  playlist: null | PlaylistData
}

export const useScrollToCurrentTrack = ({
  currentAudio,
  finalSnapIndex,
  intendedOffsetRef,
  playlist,
}: UseScrollToCurrentTrackParams) => {
  const didScrollRef = useRef(false)
  const retryCountRef = useRef(0)
  const [scheduler] = useState(() => createScrollScheduler())
  const {
    currentIndexRef,
    guards,
    handleDragEnd,
    handleDragStart,
    handleMomentumEnd,
    handleMomentumStart,
    listRef,
    noteSheetIndex,
  } = useScrollGuards(finalSnapIndex)

  const currentIndex = useMemo(
    () => playlist?.sermons.findIndex(sermon => sermon.id === currentAudio?.id) ?? -1,
    [currentAudio?.id, playlist],
  )

  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex, currentIndexRef])

  useEffect(() => () => scheduler.clearAll(), [scheduler])

  const initialNumToRender = INITIAL_NUM_TO_RENDER

  const scrollToCurrent = useCallback(() => {
    if (currentIndex < 0) return
    // Near-top target is already visible at open — skip the correction jump.
    if (isOffsetNegligible(currentIndex)) return
    // One-shot per mount: only the first settle of the top snap scrolls.
    if (didScrollRef.current) return
    didScrollRef.current = true
    // Defer by two animation frames: gorhom keeps the nested scrollable locked
    // until the sheet settles at the top snap (EXTENDED); the unlock commits on
    // the NEXT frame after onChange (Reanimated derived-status, issue #2737).
    scheduler.scheduleNudge(() => {
      if (
        guards.lastSheetIndexRef.current !== finalSnapIndex ||
        guards.isDraggingRef.current ||
        guards.isMomentumRef.current
      ) {
        // The sheet left the top snap (or the user is dragging/flinging) before
        // the nudge fired — re-arm the one-shot so a later settle retries.
        didScrollRef.current = false
        return
      }
      const index = guards.currentIndexRef.current
      if (index < 0) return
      guards.listRef.current?.scrollToIndex({ animated: false, index, viewPosition: 0 })
    })
  }, [currentIndex, finalSnapIndex, guards, scheduler])

  const handleScrollToIndexFailed = useCallback(
    (info: ScrollToIndexFailedInfo) => {
      // The estimate jump is the intended landing offset: the reveal gate
      // compares real scroll offsets against it before unmasking the list.
      intendedOffsetRef.current = info.averageItemLength * info.index
      scheduleEstimateRetry(
        scheduler,
        guards,
        finalSnapIndex,
        info,
        retryCountRef,
        MAX_SCROLL_RETRIES,
        RETRY_BASE_DELAY_MS,
      )
    },
    [finalSnapIndex, guards, intendedOffsetRef, scheduler, retryCountRef],
  )

  const hasPendingScroll = useCallback(() => scheduler.hasPending(), [scheduler])

  return {
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
  }
}
