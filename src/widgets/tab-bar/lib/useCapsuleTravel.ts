import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrameCallback } from 'react-native-reanimated'
import { capsuleTravelDriver } from '../model/capsuleTravelDriver'
import { type CapsuleTravelMotion, getSlotRects, type SlotCapsuleMotion } from './capsuleTravel'

interface CapsuleTravel {
  /** Values the traveling capsule element reads. */
  motion: CapsuleTravelMotion
  /** Per-slot geometry, or undefined for an index outside the row. */
  motionFor: (slotIndex: number) => SlotCapsuleMotion | undefined
  /** Resting geometry committed after the animated style (Issue #63 remount). */
  resting: { left: number; width: number }
}

interface CapsuleTravelInput {
  activeRouteKey: string | undefined
  hideSearch: boolean
  /** Expanded pose only: the folded circle keeps its own static highlight. */
  isExpanded: boolean
  isSearchFocused: boolean
  searchWidth: number
  /** The routed tabs, in slot order; the search slot trails them. */
  tabRouteKeys: readonly string[]
  tabWidth: number
}

// Owns the traveling capsule: derives every slot rect from the same width math
// the slots use, parks the first mount on the active slot, and starts a travel
// whenever the highlighted destination moves while the island is expanded.
export const useCapsuleTravel = ({
  activeRouteKey,
  hideSearch,
  isExpanded,
  isSearchFocused,
  searchWidth,
  tabRouteKeys,
  tabWidth,
}: CapsuleTravelInput): CapsuleTravel => {
  const tabCount = tabRouteKeys.length
  const searchSlotIndex = hideSearch ? -1 : tabCount
  const tabSlotIndex = tabRouteKeys.indexOf(activeRouteKey ?? '')
  const activeIndex =
    isSearchFocused && searchSlotIndex >= 0 ? searchSlotIndex : Math.max(tabSlotIndex, 0)
  const slotRects = useMemo(() => {
    const widths = Array.from({ length: tabCount }, () => tabWidth)

    if (searchSlotIndex >= 0) widths.push(searchWidth)

    return getSlotRects(widths)
  }, [tabCount, tabWidth, searchWidth, searchSlotIndex])
  const previousIndex = useRef(activeIndex)
  // The first render must already paint the capsule on the active slot: parking
  // it in an effect would flash it at the row start for a frame.
  const [, setTravelCount] = useState(() => {
    const rect = slotRects[activeIndex]

    if (rect) capsuleTravelDriver.snapTo({ center: rect.center, width: rect.capsuleWidth })

    return 0
  })
  const frameCallback = useFrameCallback(capsuleTravelDriver.frameStep, false)

  useEffect(() => {
    const detachSettled = capsuleTravelDriver.registerSettledListener(() =>
      setTravelCount(count => count + 1),
    )
    const detachHost = capsuleTravelDriver.attachFrameHost(frameCallback)

    return () => {
      detachSettled()
      detachHost()
    }
  }, [frameCallback])

  useEffect(() => {
    const previous = previousIndex.current
    previousIndex.current = activeIndex
    const rect = slotRects[activeIndex]

    if (!rect) return

    const landing = { center: rect.center, width: rect.capsuleWidth }

    if (!isExpanded || previous === activeIndex) {
      capsuleTravelDriver.snapTo(landing)

      return
    }

    capsuleTravelDriver.travelTo(landing, Math.abs(activeIndex - previous))
  }, [activeIndex, isExpanded, slotRects])

  const activeRect = slotRects[activeIndex]

  return {
    motion: {
      arrivalPulse: capsuleTravelDriver.arrivalPulse,
      capsuleCenter: capsuleTravelDriver.capsuleCenter,
      capsuleWidth: capsuleTravelDriver.capsuleWidth,
      slotRects,
      travelActivity: capsuleTravelDriver.travelActivity,
    },
    motionFor: slotIndex => {
      const rect = slotRects[slotIndex]

      if (!rect) return undefined

      return {
        arrivalPulse: capsuleTravelDriver.arrivalPulse,
        capsuleCenter: capsuleTravelDriver.capsuleCenter,
        isTravelTarget: slotIndex === activeIndex,
        slotCenter: rect.center,
        slotWidth: rect.slotWidth,
        travelActivity: capsuleTravelDriver.travelActivity,
      }
    },
    resting: {
      left: activeRect ? activeRect.center - activeRect.capsuleWidth / 2 : 0,
      width: activeRect?.capsuleWidth ?? 0,
    },
  }
}
