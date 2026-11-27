import { useCallback, useEffect, useRef } from 'react'
import { capsuleTravelDriver } from '../model/capsuleTravelDriver'
import { type CapsuleSlotRect } from './capsuleTravel'

interface CapsuleTravelRequestContext {
  isExpanded: boolean
  /** Route key of every slot, tabs first and the search slot last. */
  slotKeys: readonly string[]
  slotRects: readonly CapsuleSlotRect[]
}

// Press-tick travel start: the tap must move the highlight before React has
// re-rendered the navigator, so the layout the press path needs lives in a ref
// synced after commit and `requestTravel` reads it synchronously.
export const useCapsuleTravelRequest = (
  context: CapsuleTravelRequestContext,
  currentSlotIndex: { current: number },
) => {
  const { isExpanded, slotKeys, slotRects } = context
  const latest = useRef({ isExpanded, slotKeys, slotRects })

  useEffect(() => {
    latest.current = { isExpanded, slotKeys, slotRects }
  })

  return useCallback(
    (routeKey: string) => {
      const { isExpanded: expanded, slotKeys: keys, slotRects: rects } = latest.current

      // Collapsed: the route effect snaps the capsule, no glide to start.
      if (!expanded) return

      // The destination resolves through the same ordering as the start slot,
      // so the search slot is a regular index here too (tabs, then search).
      const targetIndex = keys.indexOf(routeKey)
      const distance = Math.abs(targetIndex - currentSlotIndex.current)
      const rect = targetIndex >= 0 ? rects[targetIndex] : undefined

      if (!rect || distance === 0) return

      capsuleTravelDriver.travelTo({ center: rect.center, width: rect.capsuleWidth }, distance)
    },
    [currentSlotIndex],
  )
}
