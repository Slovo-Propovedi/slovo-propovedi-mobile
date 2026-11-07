import { INDENTS } from '../theme/themed'

// Geometry of the Apple-Music-style floating bottom bar: the mini player sits in
// a rounded island above the tab-bar island, and both collapse into one row.
export const BAR_ROW_MIN_HEIGHT = 84 as const
// Collapsed island/circle dimensions (64) and the taller expanded sizes (76).
// The island height, the tab circle and the search circle all morph between them.
export const TAB_BAR_ISLAND_HEIGHT = 64 as const
export const TAB_BAR_ISLAND_HEIGHT_EXPANDED = 76 as const
// Islands are centered in the row's fixed BAR_ROW_MIN_HEIGHT content box, so the
// expanded island's top edge sits this far below the row's top edge. The row's
// measured height already includes the bottom safe-area padding, which keeps the
// offset valid for any inset.
export const BAR_EXPANDED_ISLAND_TOP_MARGIN =
  (BAR_ROW_MIN_HEIGHT - TAB_BAR_ISLAND_HEIGHT_EXPANDED) / 2
export const BAR_CIRCLE_SIZE = 64 as const
export const BAR_CIRCLE_SIZE_EXPANDED = 76 as const
export const BAR_OUTER_GAP = 12 as const
// Generous side margins of the floating chrome (tab bar and resting mini player).
export const BAR_SIDE_INSET = INDENTS.medium
// Small bottom clearance below the islands: gesture-nav/web/desktop sit low,
// while a real system inset (3-button navigation) still lifts the row.
export const BAR_BOTTOM_INSET_MIN = 12 as const
// Scroll offset past which the bar collapses to a single row.
export const COLLAPSE_SCROLL_THRESHOLD = 80 as const
// Scroll offset at or above which the collapsed bar expands back.
export const EXPAND_TOP_THRESHOLD = 4 as const
export const BAR_MORPH_DURATION_MS = 300 as const
