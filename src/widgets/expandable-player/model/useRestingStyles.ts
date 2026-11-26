import { useMemo } from 'react'
import { Platform } from 'react-native'
import { useIsWideLayout } from 'shared/ui/layout'
import { getMiniBarStyle } from '../lib/getMiniBarStyle'
import { getRestingContainerStyle } from '../lib/getRestingContainerStyle'

interface UseRestingStylesInput {
  /** Bar state the morph has settled into (see `useAtomMorphDriver(oneLineBarMorphDriver)`). */
  barCollapsed: boolean
  expanded: boolean
  fullScreenHeight: number
  screenWidth: number
  tabBarHeight: number
}

const getMiniRestingTop = ({
  barCollapsed,
  fullScreenHeight,
  isWeb,
  isWideLayout,
  screenWidth,
  tabBarHeight,
}: { isWeb: boolean; isWideLayout: boolean } & Omit<UseRestingStylesInput, 'expanded'>) =>
  getRestingContainerStyle({
    barCollapsed,
    expanded: false,
    fullScreenHeight,
    isWeb,
    isWideLayout,
    screenWidth,
    tabBarHeight,
  }).top

/**
 * React-committed (shadow-tree) resting geometry for the container and the mini
 * pill, restated for the SETTLED bar and expand state. The callers feed the
 * settled state (not the live props), so while a morph is in flight this layer
 * carries the START geometry — never the destination a frame early — and the
 * animated layer drives toward the target on top of it. At settle both layers
 * agree in the destination state (Issue #63 shadow-tree defense).
 *
 * `barExpandedTop` / `barCollapsedTop` are both mini resting tops regardless of
 * the settled state: the geometry guard derives its expectation from the live
 * morph progress (0 → expanded top, 1 → collapsed top), never from a separately
 * tracked settle flag.
 *
 * In the wide layout the bar-collapse axis is forced to the expanded pose: the
 * tab island is anchored to the top, so the pill never folds into a bottom row.
 * @param input - Player state and screen geometry.
 * @param input.barCollapsed - Bar state whose morph has already completed (the start state mid-morph).
 * @param input.expanded - Whether the player is expanded to fullscreen.
 * @param input.fullScreenHeight - Full device screen height.
 * @param input.screenWidth - Current window width.
 * @param input.tabBarHeight - Measured height of the floating tab row.
 */
export const useRestingStyles = ({
  barCollapsed,
  expanded,
  fullScreenHeight,
  screenWidth,
  tabBarHeight,
}: UseRestingStylesInput) => {
  const isWideLayout = useIsWideLayout()
  const isWeb = Platform.OS === 'web'
  // Wide has no bottom row to fold into: the expanded pose is the only pose.
  const restingBarCollapsed = isWideLayout ? false : barCollapsed
  const restingContainerStyle = useMemo(
    () =>
      getRestingContainerStyle({
        barCollapsed: restingBarCollapsed,
        expanded,
        fullScreenHeight,
        isWeb,
        isWideLayout,
        screenWidth,
        tabBarHeight,
      }),
    [
      expanded,
      fullScreenHeight,
      isWeb,
      isWideLayout,
      screenWidth,
      restingBarCollapsed,
      tabBarHeight,
    ],
  )
  const barExpandedTop = useMemo(
    () =>
      getMiniRestingTop({
        barCollapsed: false,
        fullScreenHeight,
        isWeb,
        isWideLayout,
        screenWidth,
        tabBarHeight,
      }),
    [fullScreenHeight, isWeb, isWideLayout, screenWidth, tabBarHeight],
  )
  const barCollapsedTop = useMemo(
    () =>
      getMiniRestingTop({
        barCollapsed: true,
        fullScreenHeight,
        isWeb,
        isWideLayout,
        screenWidth,
        tabBarHeight,
      }),
    [fullScreenHeight, isWeb, isWideLayout, screenWidth, tabBarHeight],
  )
  const miniBarRestingStyle = useMemo(
    () =>
      getMiniBarStyle({
        barProgress: restingBarCollapsed ? 1 : 0,
        fullScreenHeight,
        isWeb,
        isWideLayout,
        screenWidth,
        tabBarHeight,
      }),
    [fullScreenHeight, isWeb, isWideLayout, screenWidth, restingBarCollapsed, tabBarHeight],
  )

  return { barCollapsedTop, barExpandedTop, miniBarRestingStyle, restingContainerStyle }
}
