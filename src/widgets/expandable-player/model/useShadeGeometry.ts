import { useEffect } from 'react'
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { BAR_MORPH_DURATION_MS } from 'shared/ui/layout'
import { getBarShadeHeight, getPillShadeHeight, getShadeLocations } from '../lib/getBarShadeHeight'
import { getShadeHoles } from '../lib/getShadeHoles'
import { useBarMorphProgress } from './useBarMorphProgress'

interface ShadeGeometryInput {
  bottomPadding: number
  fullScreenHeight: number
  hasClose: boolean
  hasPill: boolean
  hasSearch: boolean
  isFocused: boolean
  isSearchVisible: boolean
  screenWidth: number
  tabBarHeight: number
}

/**
 * Animated shade height plus the settled gradient stops and chrome cutouts.
 * The height follows the shared bar morph per frame; stops and holes are plain
 * React values recomputed on state commits, so they never fight the animation.
 * @param input - Chrome state and viewport geometry.
 * @param input.bottomPadding - Bottom clearance below the islands.
 * @param input.fullScreenHeight - Full device screen height.
 * @param input.hasClose - The external ✕ is on screen.
 * @param input.hasPill - This zone mounts the mini-player pill.
 * @param input.hasSearch - This zone renders the search chrome.
 * @param input.isFocused - The search field has focus.
 * @param input.isSearchVisible - The search field occupies the row.
 * @param input.screenWidth - Current viewport width.
 * @param input.tabBarHeight - Measured height of the floating tab row.
 */
export const useShadeGeometry = ({
  bottomPadding,
  fullScreenHeight,
  hasClose,
  hasPill,
  hasSearch,
  isFocused,
  isSearchVisible,
  screenWidth,
  tabBarHeight,
}: ShadeGeometryInput) => {
  const { progress, settledCollapsed } = useBarMorphProgress()
  const focusProgress = useSharedValue(isFocused ? 1 : 0)
  // Starts after the tuck's zIndex commit; the pill uses the same post-commit
  // timing, so the shade and the sliding pill stay in step.
  useEffect(() => {
    focusProgress.value = withTiming(isFocused ? 1 : 0, { duration: BAR_MORPH_DURATION_MS })
  }, [focusProgress, isFocused])

  const shadeStyle = useAnimatedStyle(() => {
    if (!hasPill) return { height: getBarShadeHeight(progress.value, bottomPadding) }

    return {
      height: getPillShadeHeight({
        barProgress: progress.value,
        bottomPadding,
        focusProgress: focusProgress.value,
        fullScreenHeight,
        screenWidth,
        tabBarHeight,
      }),
    }
  })

  const settledBarProgress = settledCollapsed ? 1 : 0
  const shadeHeight = hasPill
    ? getPillShadeHeight({
        barProgress: settledBarProgress,
        bottomPadding,
        focusProgress: isFocused ? 1 : 0,
        fullScreenHeight,
        screenWidth,
        tabBarHeight,
      })
    : getBarShadeHeight(settledBarProgress, bottomPadding)
  const holes = getShadeHoles({
    barCollapsed: settledCollapsed,
    fullScreenHeight,
    hasClose,
    hasPill,
    hasSearch,
    isFocused,
    isSearchVisible,
    screenWidth,
    shadeHeight,
    tabBarHeight,
  })

  return { holes, locations: getShadeLocations(shadeHeight), shadeStyle }
}
