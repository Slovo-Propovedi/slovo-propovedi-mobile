import { getIslandShadeHole } from './getIslandShadeHole'
import { getPillShadeHole } from './getPillShadeHole'
import { getSearchShadeHoles } from './getSearchShadeHoles'
import { getShadeFrameHeight } from './getShadeFrameHeight'
import { getShadeRow, type ShadeHole } from './shadeRow'

export type ShadeHoleKey = 'close' | 'island' | 'pill' | 'search'

/** Static inputs of one shade box; React-committed, not part of the morph. */
export interface ShadeHoleLayout {
  bottomPadding: number
  fullScreenHeight: number
  hasPill: boolean
  /** This zone mounts the search chrome (hidden on the admin tab layout). */
  hasSearch: boolean
  screenWidth: number
  tabBarHeight: number
}

type ShadeHoleRects = Record<ShadeHoleKey, ShadeHole>

/** Animated inputs of one frame, one per morph axis. */
interface ShadeMorphFrame {
  /** Presence of the external ✕ (focus or an active query), 0..1. */
  closeProgress: number
  /** Search focus, 0..1. */
  focusProgress: number
  /** Tab-island collapse (bar collapsed or search visible), 0..1. */
  islandProgress: number
  /** Search open, 0..1. */
  openProgress: number
  /** Opacity of the tucked mini pill, 0..1; the pill cutout fades with it. */
  pillOpacity: number
  /** Mini-pill collapse into the bottom line, 0..1. */
  pillProgress: number
}

/** Fixed render slots: the mask never remounts a rect mid-morph. */
export const SHADE_HOLE_KEYS: readonly ShadeHoleKey[] = ['island', 'search', 'close', 'pill']

/**
 * Footprints of the bottom chrome at one animated frame, to be cut out of the
 * shade so the glass never samples the gradient it sits on. Every rect is a
 * pure function of numeric progress values (no atom/hook reads), so the same
 * inputs always produce the same mask and the glass can consume the identical
 * driver values.
 *
 * Worklet-safe: called from `useAnimatedProps` of the mask rects.
 * @param layout - Static shade box / chrome mounting inputs.
 * @param frame - Progress of each morph axis at this frame.
 * @returns One rect per fixed slot, in shade-box coordinates.
 */
export const getShadeHoles = (layout: ShadeHoleLayout, frame: ShadeMorphFrame): ShadeHoleRects => {
  'worklet'
  const shadeHeight = getShadeFrameHeight({
    barProgress: frame.pillProgress,
    bottomPadding: layout.bottomPadding,
    focusProgress: frame.focusProgress,
    fullScreenHeight: layout.fullScreenHeight,
    hasPill: layout.hasPill,
    screenWidth: layout.screenWidth,
    tabBarHeight: layout.tabBarHeight,
  })
  const row = getShadeRow({
    islandProgress: frame.islandProgress,
    screenWidth: layout.screenWidth,
    shadeHeight,
    tabBarHeight: layout.tabBarHeight,
  })
  const { close, search } = getSearchShadeHoles(row, {
    closeProgress: frame.closeProgress,
    focusProgress: frame.focusProgress,
    hasSearch: layout.hasSearch,
    openProgress: frame.openProgress,
    screenWidth: layout.screenWidth,
  })

  return {
    close,
    island: getIslandShadeHole(row, {
      focusProgress: frame.focusProgress,
      hasSearch: layout.hasSearch,
      islandProgress: frame.islandProgress,
    }),
    pill: getPillShadeHole(row, {
      focusProgress: frame.focusProgress,
      fullScreenHeight: layout.fullScreenHeight,
      hasPill: layout.hasPill,
      pillOpacity: frame.pillOpacity,
      pillProgress: frame.pillProgress,
      screenWidth: layout.screenWidth,
      tabBarHeight: layout.tabBarHeight,
    }),
    search,
  }
}
