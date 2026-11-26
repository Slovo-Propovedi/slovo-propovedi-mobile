import { BAR_EXPANDED_ISLAND_TOP_MARGIN, BAR_PILL_ROW_GAP } from 'shared/ui/layout'

/**
 * Real resting bottom of the detached expanded mini-player: one pill-row gap
 * above the expanded island's top edge. Used as the pan reference so a full
 * swipe-up reaches the same edge the pill rests at. In the wide layout the pill
 * rests on the chrome's bottom padding instead (the tab island is at the top).
 * @param tabBarHeight - Measured height of the floating tab row.
 * @param isWideLayout - Whether the wide layout applies.
 * @param wideBottomInset - The chrome's bottom padding, the wide pill's rest line.
 */
export const getExpandedRestingBottom = (
  tabBarHeight: number,
  isWideLayout: boolean,
  wideBottomInset: number,
) => {
  if (isWideLayout) return wideBottomInset

  return tabBarHeight - BAR_EXPANDED_ISLAND_TOP_MARGIN + BAR_PILL_ROW_GAP
}
