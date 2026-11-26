import { getMiniPlayerGeometry } from './getMiniPlayerGeometry'

interface RestingContainerStyleInput {
  /** Whether the bottom bar is collapsed into a single row. */
  barCollapsed: boolean
  expanded: boolean
  fullScreenHeight: number
  isWideLayout?: boolean
  screenWidth: number
  tabBarHeight: number
  wideBottomInset: number
}

/**
 * Non-animated resting geometry of the player container for the current React
 * state. Committed through the React shadow tree, which never drops updates —
 * unlike Reanimated JS-triggered commits during the busy startup window
 * (Issue #63). The animated containerStyle overrides these values during
 * transitions; at rest both layers agree, in BOTH bar states (the mini pill is
 * restated for the collapsed bottom line too).
 * @param root0 - Input geometry parameters.
 * @param root0.barCollapsed - Whether the bottom bar is collapsed to one row.
 * @param root0.expanded - Whether the player is expanded to fullscreen.
 * @param root0.fullScreenHeight - Full device screen height.
 * @param root0.isWideLayout - Whether the wide layout applies.
 * @param root0.screenWidth - Current window width.
 * @param root0.tabBarHeight - Measured height of the floating tab row.
 * @param root0.wideBottomInset - The chrome's bottom padding, the wide pill's rest line.
 */
export const getRestingContainerStyle = ({
  barCollapsed,
  expanded,
  fullScreenHeight,
  isWideLayout = false,
  screenWidth,
  tabBarHeight,
  wideBottomInset,
}: RestingContainerStyleInput) => {
  if (expanded)
    return {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      bottom: 0,
      left: 0,
      top: 0,
      width: screenWidth,
    }

  const geometry = getMiniPlayerGeometry({
    barProgress: barCollapsed ? 1 : 0,
    fullScreenHeight,
    isWideLayout,
    screenWidth,
    tabBarHeight,
    wideBottomInset,
  })

  return {
    borderBottomLeftRadius: geometry.radius,
    borderBottomRightRadius: geometry.radius,
    borderTopLeftRadius: geometry.radius,
    borderTopRightRadius: geometry.radius,
    bottom: geometry.bottom,
    left: geometry.left,
    top: geometry.top,
    width: geometry.width,
  }
}
