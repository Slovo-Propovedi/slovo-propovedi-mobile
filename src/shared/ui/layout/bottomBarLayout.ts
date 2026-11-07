import { INDENTS } from '../theme/themed'

// Geometry of the Apple-Music-style floating bottom bar: the mini player sits in
// a rounded island above the tab-bar island, and both collapse into one row.
export const BAR_ROW_MIN_HEIGHT = 84 as const
// Collapsed island/circle dimensions (64) and the taller expanded sizes (76).
// The island height, the tab circle and the search circle all morph between them.
export const TAB_BAR_ISLAND_HEIGHT = 64 as const
export const TAB_BAR_ISLAND_HEIGHT_EXPANDED = 76 as const
export const BAR_CIRCLE_SIZE = 64 as const
export const BAR_CIRCLE_SIZE_EXPANDED = 76 as const
export const BAR_OUTER_GAP = 12 as const
// Matches the floating chrome inset (tab bar and resting mini player).
export const BAR_SIDE_INSET = INDENTS.middle
// Scroll offset past which the bar collapses to a single row.
export const COLLAPSE_SCROLL_THRESHOLD = 80 as const
// Scroll offset at or above which the collapsed bar expands back.
export const EXPAND_TOP_THRESHOLD = 4 as const
export const BAR_MORPH_DURATION_MS = 300 as const
