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

/**
 * React-committed (shadow-tree) resting geometry for the container and the mini
 * pill. Restated for the SETTLED bar state so the #63 defenses never restore a
 * stale expanded-bar position while the bar is collapsed — and never paint the
 * destination geometry a frame before the morph lands there.
 * @param input - Player state and screen geometry.
 * @param input.barCollapsed - Bar state whose morph has already completed.
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
  // Always mini (never fullscreen) resting geometry — the heal-loop expectation,
  // restated for whichever bar state the pill currently rests in.
  const collapsedRestingContainerStyle = useMemo(
    () =>
      getRestingContainerStyle({
        barCollapsed,
        expanded: false,
        fullScreenHeight,
        screenWidth,
        tabBarHeight,
      }),
    [barCollapsed, fullScreenHeight, screenWidth, tabBarHeight],
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

  return { collapsedRestingContainerStyle, miniBarRestingStyle, restingContainerStyle }
}
