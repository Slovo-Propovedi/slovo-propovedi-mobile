import {
  BAR_EXPANDED_ISLAND_TOP_MARGIN,
  BAR_PILL_ROW_GAP,
  getWideMiniPlayerBottomInset,
} from 'shared/ui/layout'

/**
 * Real resting bottom of the detached expanded mini-player: one pill-row gap
 * above the expanded island's top edge. Used as the pan reference so a full
 * swipe-up reaches the same edge the pill rests at. In the wide layout the pill
 * rests on the screen bottom edge instead (the tab island is at the top).
 * @param tabBarHeight - Measured height of the floating tab row.
 * @param isWideLayout - Whether the wide (>= 768) layout applies.
 * @param isWeb - Whether the platform is web.
 */
export const getExpandedRestingBottom = (
  tabBarHeight: number,
  isWideLayout = false,
  isWeb = false,
) => {
  if (isWideLayout) return getWideMiniPlayerBottomInset(isWeb)

  return tabBarHeight - BAR_EXPANDED_ISLAND_TOP_MARGIN + BAR_PILL_ROW_GAP
}
