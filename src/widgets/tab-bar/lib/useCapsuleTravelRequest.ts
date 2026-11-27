import { useCallback, useEffect, useRef } from 'react'
import { capsuleTravelDriver } from '../model/capsuleTravelDriver'
import { type CapsuleSlotRect } from './capsuleTravel'

interface CapsuleTravelRequestContext {
  isExpanded: boolean
  slotRects: readonly CapsuleSlotRect[]
  tabRouteKeys: readonly string[]
}

// Press-tick travel start: the tap must move the highlight before React has
// re-rendered the navigator, so the layout the press path needs lives in a ref
// synced after commit and `requestTravel` reads it synchronously.
export const useCapsuleTravelRequest = (
  context: CapsuleTravelRequestContext,
  currentSlotIndex: { current: number },
) => {
  const { isExpanded, slotRects, tabRouteKeys } = context
  const latest = useRef({ isExpanded, slotRects, tabRouteKeys })

  useEffect(() => {
    latest.current = { isExpanded, slotRects, tabRouteKeys }
  })

  return useCallback(
    (routeKey: string) => {
      const { isExpanded: expanded, slotRects: rects, tabRouteKeys: keys } = latest.current

      // Collapsed: the route effect snaps the capsule, no glide to start.
      if (!expanded) return

      const targetIndex = keys.indexOf(routeKey)
      const distance = Math.abs(targetIndex - currentSlotIndex.current)
      const rect = targetIndex >= 0 ? rects[targetIndex] : undefined

      if (!rect || distance === 0) return

      capsuleTravelDriver.travelTo({ center: rect.center, width: rect.capsuleWidth }, distance)
    },
    [currentSlotIndex],
  )
}
