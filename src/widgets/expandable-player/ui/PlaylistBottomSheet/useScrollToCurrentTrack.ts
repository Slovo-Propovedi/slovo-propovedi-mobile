import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ScrollGuards, ScrollToIndexFailedInfo } from './scrollGuards'
import type { BottomSheetFlatListMethods } from '@gorhom/bottom-sheet'
import type { AudioPlayerData, PlaylistData } from 'shared/model'
import { scheduleEstimateRetry } from './scrollGuards'
import { createScrollScheduler } from './scrollScheduler'
import { isOffsetNegligible } from './useListReveal'

const MAX_SCROLL_RETRIES = 6
const RETRY_BASE_DELAY_MS = 100
// The skeleton hides scroll convergence; the estimate+retry fallback lands
// exact. The initial window stays mounted forever, so keep it small.
const INITIAL_NUM_TO_RENDER = 10

interface UseScrollToCurrentTrackParams {
  currentAudio: AudioPlayerData | null
  finalSnapIndex: number
  playlist: null | PlaylistData
}

export const useScrollToCurrentTrack = ({
  currentAudio,
  finalSnapIndex,
  playlist,
}: UseScrollToCurrentTrackParams) => {
  const listRef = useRef<BottomSheetFlatListMethods>(null)
  const didScrollRef = useRef(false)
  const retryCountRef = useRef(0)
  // The sheet mounts at the final snap, so it starts there.
  const lastSheetIndexRef = useRef(finalSnapIndex)
  const isDraggingRef = useRef(false)
  const isMomentumRef = useRef(false)
  const [scheduler] = useState(() => createScrollScheduler())

  const currentIndex = useMemo(
    () => playlist?.sermons.findIndex(sermon => sermon.id === currentAudio?.id) ?? -1,
    [currentAudio?.id, playlist],
  )
  const currentIndexRef = useRef(currentIndex)

  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  useEffect(() => () => scheduler.clearAll(), [scheduler])

  const guards = useMemo<ScrollGuards>(
    () => ({ currentIndexRef, isDraggingRef, isMomentumRef, lastSheetIndexRef, listRef }),
    [currentIndexRef, isDraggingRef, isMomentumRef, lastSheetIndexRef, listRef],
  )

  const initialNumToRender = INITIAL_NUM_TO_RENDER

  const noteSheetIndex = useCallback((index: number) => {
    lastSheetIndexRef.current = index
  }, [])

  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true
  }, [])

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false
  }, [])

  const handleMomentumStart = useCallback(() => {
    isMomentumRef.current = true
  }, [])

  const handleMomentumEnd = useCallback(() => {
    isMomentumRef.current = false
  }, [])

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
        lastSheetIndexRef.current !== finalSnapIndex ||
        isDraggingRef.current ||
        isMomentumRef.current
      ) {
        // The sheet left the top snap (or the user is dragging/flinging) before
        // the nudge fired — re-arm the one-shot so a later settle retries.
        didScrollRef.current = false
        return
      }
      const index = currentIndexRef.current
      if (index < 0) return
      listRef.current?.scrollToIndex({ animated: false, index, viewPosition: 0 })
    })
  }, [currentIndex, finalSnapIndex, scheduler])

  const handleScrollToIndexFailed = useCallback(
    (info: ScrollToIndexFailedInfo) => {
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
    [finalSnapIndex, guards, scheduler, retryCountRef],
  )

  return {
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
  }
}
