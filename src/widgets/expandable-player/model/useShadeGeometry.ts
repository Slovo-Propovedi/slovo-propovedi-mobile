import { type SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import {
  searchCloseMorphDriver,
  searchFocusMorphDriver,
  searchOpenMorphDriver,
} from 'widgets/search-island/@x/morphDrivers'
import { tabIslandMorphDriver } from 'widgets/tab-bar/@x/morph'
import { useAtomMorphDriver } from 'shared/lib/hooks/useAtomMorphDriver'
import { getShadeLocations } from '../lib/getBarShadeHeight'
import { getShadeFrameHeight } from '../lib/getShadeFrameHeight'
import { type ShadeHoleLayout } from '../lib/getShadeHoles'
import { barMorphDriver } from './barMorphDriver'
import { miniPillOpacitySv } from './miniPillFade'

/** Shared morph values every mask rect derives its geometry from. */
export interface ShadeMorphSources {
  closeProgress: SharedValue<number>
  focusProgress: SharedValue<number>
  islandProgress: SharedValue<number>
  openProgress: SharedValue<number>
  /** Fade of the tucked mini pill; its cutout loses strength with it. */
  pillOpacity: SharedValue<number>
  pillProgress: SharedValue<number>
}

interface ShadeGeometryInput {
  bottomPadding: number
  fullScreenHeight: number
  hasPill: boolean
  hasSearch: boolean
  screenWidth: number
  tabBarHeight: number
}

/**
 * Animated shade height, gradient stops and the shared progress sources of the
 * chrome cutouts.
 *
 * All four morph axes are module-level drivers on the shared
 * `createAtomMorphDriver` factory, so the animated height and the mask rects
 * read the same values as the glass surfaces they cut around. The stops stay
 * plain React values recomputed on state commits, so they never fight the
 * animation.
 * @param input - Chrome mounting state and viewport geometry.
 * @param input.bottomPadding - Bottom clearance below the islands.
 * @param input.fullScreenHeight - Full device screen height.
 * @param input.hasPill - This zone mounts the mini-player pill.
 * @param input.hasSearch - This zone renders the search chrome.
 * @param input.screenWidth - Current viewport width.
 * @param input.tabBarHeight - Measured height of the floating tab row.
 */
export const useShadeGeometry = ({
  bottomPadding,
  fullScreenHeight,
  hasPill,
  hasSearch,
  screenWidth,
  tabBarHeight,
}: ShadeGeometryInput) => {
  const { progress: pillProgress } = useAtomMorphDriver(barMorphDriver)
  const { progress: islandProgress } = useAtomMorphDriver(tabIslandMorphDriver)
  const { progress: openProgress } = useAtomMorphDriver(searchOpenMorphDriver)
  const { progress: focusProgress } = useAtomMorphDriver(searchFocusMorphDriver)
  const { progress: closeProgress } = useAtomMorphDriver(searchCloseMorphDriver)

  const shadeStyle = useAnimatedStyle(() => ({
    height: getShadeFrameHeight({
      barProgress: pillProgress.value,
      bottomPadding,
      focusProgress: focusProgress.value,
      fullScreenHeight,
      hasPill,
      screenWidth,
      tabBarHeight,
    }),
  }))

  // The expanded pill-anchored state is the tallest shade, so a fixed Svg sized
  // to it always covers the (shorter-or-equal) animated box. A plain React prop
  // re-measures reliably when tabBarHeight commits — react-native-svg on Android
  // freezes percentage sizing at the first measure.
  const svgHeight = getShadeFrameHeight({
    barProgress: 0,
    bottomPadding,
    focusProgress: 0,
    fullScreenHeight,
    hasPill,
    screenWidth,
    tabBarHeight,
  })
  const layout: ShadeHoleLayout = {
    bottomPadding,
    fullScreenHeight,
    hasPill,
    hasSearch,
    screenWidth,
    tabBarHeight,
  }

  return {
    layout,
    locations: getShadeLocations(svgHeight),
    shadeStyle,
    sources: {
      closeProgress,
      focusProgress,
      islandProgress,
      openProgress,
      pillOpacity: miniPillOpacitySv,
      pillProgress,
    },
    svgHeight,
  }
}
