import { useMemo } from 'react'
import { getMiniBarStyle } from '../lib/getMiniBarStyle'
import { getRestingContainerStyle } from '../lib/getRestingContainerStyle'

interface UseRestingStylesInput {
  /** Bar state the morph has settled into (see `useBarMorphProgress.settledCollapsed`). */
  barCollapsed: boolean
  expanded: boolean
  fullScreenHeight: number
  screenWidth: number
  tabBarHeight: number
}

const getMiniRestingTop = ({
  barCollapsed,
  fullScreenHeight,
  screenWidth,
  tabBarHeight,
}: Omit<UseRestingStylesInput, 'expanded'>) =>
  getRestingContainerStyle({
    barCollapsed,
    expanded: false,
    fullScreenHeight,
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
  const restingContainerStyle = useMemo(
    () =>
      getRestingContainerStyle({
        barCollapsed,
        expanded,
        fullScreenHeight,
        screenWidth,
        tabBarHeight,
      }),
    [barCollapsed, expanded, fullScreenHeight, screenWidth, tabBarHeight],
  )
  const barExpandedTop = useMemo(
    () =>
      getMiniRestingTop({
        barCollapsed: false,
        fullScreenHeight,
        screenWidth,
        tabBarHeight,
      }),
    [fullScreenHeight, screenWidth, tabBarHeight],
  )
  const barCollapsedTop = useMemo(
    () =>
      getMiniRestingTop({
        barCollapsed: true,
        fullScreenHeight,
        screenWidth,
        tabBarHeight,
      }),
    [fullScreenHeight, screenWidth, tabBarHeight],
  )
  const miniBarRestingStyle = useMemo(
    () =>
      getMiniBarStyle({
        barProgress: barCollapsed ? 1 : 0,
        fullScreenHeight,
        screenWidth,
        tabBarHeight,
      }),
    [barCollapsed, fullScreenHeight, screenWidth, tabBarHeight],
  )

  return { barCollapsedTop, barExpandedTop, miniBarRestingStyle, restingContainerStyle }
}
