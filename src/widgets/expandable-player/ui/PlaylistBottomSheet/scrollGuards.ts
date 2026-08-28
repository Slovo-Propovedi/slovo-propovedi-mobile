import type { ScrollScheduler } from './scrollScheduler'
import type { BottomSheetFlatListMethods } from '@gorhom/bottom-sheet'
import type { RefObject } from 'react'

export interface ScrollGuards {
  currentIndexRef: RefObject<number>
  isDraggingRef: RefObject<boolean>
  isMomentumRef: RefObject<boolean>
  lastSheetIndexRef: RefObject<number>
  listRef: RefObject<BottomSheetFlatListMethods | null>
}

export interface ScrollToIndexFailedInfo {
  averageItemLength: number
  index: number
}

export const scheduleRetry = (
  scheduler: ScrollScheduler,
  guards: ScrollGuards,
  finalSnapIndex: number,
  delay: number,
) => {
  scheduler.scheduleTimer(() => {
    // Drop the retry if the sheet moved, the user is dragging, or the list is
    // still flinging (the finger is in control — do not fight it).
    if (
      guards.lastSheetIndexRef.current !== finalSnapIndex ||
      guards.isDraggingRef.current ||
      guards.isMomentumRef.current
    )
      return
    const retryIndex = guards.currentIndexRef.current
    if (retryIndex < 0) return
    guards.listRef.current?.scrollToIndex({ animated: false, index: retryIndex, viewPosition: 0 })
  }, delay)
}

export const scheduleEstimateRetry = (
  scheduler: ScrollScheduler,
  guards: ScrollGuards,
  finalSnapIndex: number,
  info: ScrollToIndexFailedInfo,
  retryCountRef: RefObject<number>,
  maxRetries: number,
  baseDelayMs: number,
) => {
  if (
    guards.lastSheetIndexRef.current !== finalSnapIndex ||
    guards.isDraggingRef.current ||
    guards.isMomentumRef.current
  )
    return
  // Estimate-first jump: the initial window no longer pre-measures deep cells.
  guards.listRef.current?.scrollToOffset({
    animated: false,
    offset: info.averageItemLength * info.index,
  })
  if (retryCountRef.current >= maxRetries) return
  const attempt = ++retryCountRef.current
  const delay = baseDelayMs * attempt
  // Linear backoff: Android animated:false is not always instant when
  // virtualization interleaves with retries; linear backoff converges.
  scheduleRetry(scheduler, guards, finalSnapIndex, delay)
}
