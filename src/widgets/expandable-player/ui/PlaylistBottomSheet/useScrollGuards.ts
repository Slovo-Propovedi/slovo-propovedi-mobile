import { useCallback, useMemo, useRef } from 'react'
import type { ScrollGuards } from './scrollGuards'
import type { BottomSheetFlatListMethods } from '@gorhom/bottom-sheet'

// Owns the interaction refs and their setters for the auto-scroll pipeline:
// the sheet snap, the user's drag/fling state, the current target index and
// the list handle. The guards object is what scrollGuards.ts consumes.
export const useScrollGuards = (finalSnapIndex: number) => {
  const listRef = useRef<BottomSheetFlatListMethods>(null)
  const currentIndexRef = useRef(-1)
  // The sheet mounts at the final snap, so it starts there.
  const lastSheetIndexRef = useRef(finalSnapIndex)
  const isDraggingRef = useRef(false)
  const isMomentumRef = useRef(false)

  const guards = useMemo<ScrollGuards>(
    () => ({ currentIndexRef, isDraggingRef, isMomentumRef, lastSheetIndexRef, listRef }),
    [currentIndexRef, isDraggingRef, isMomentumRef, lastSheetIndexRef, listRef],
  )

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

  return {
    currentIndexRef,
    guards,
    handleDragEnd,
    handleDragStart,
    handleMomentumEnd,
    handleMomentumStart,
    isDraggingRef,
    isMomentumRef,
    lastSheetIndexRef,
    listRef,
    noteSheetIndex,
  }
}
