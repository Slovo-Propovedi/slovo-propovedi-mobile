// Geometry of the Apple-Music-style floating bottom bar: the mini player sits in
// a rounded island above the tab-bar island, and both collapse into one row.
import { SLIDER_REST_INSET } from '../slider/slider-layout.lib'

export const BAR_ROW_MIN_HEIGHT = 76 as const
// Collapsed island/circle dimensions (56) and the taller expanded sizes (68).
// The island height, the tab circle and the search circle all morph between them.
export const TAB_BAR_ISLAND_HEIGHT = 56 as const
export const TAB_BAR_ISLAND_HEIGHT_EXPANDED = 68 as const
// The expanded island's top edge sits this far below the row's top edge: the
// islands are anchored to the row's bottom edge (the safe-area line), so the
// gap is the unused space above the expanded island. The row's measured height
// already includes the bottom safe-area padding, which keeps the offset valid
// for any inset.
export const BAR_EXPANDED_ISLAND_TOP_MARGIN = BAR_ROW_MIN_HEIGHT - TAB_BAR_ISLAND_HEIGHT_EXPANDED
export const BAR_CIRCLE_SIZE = 56 as const
export const BAR_CIRCLE_SIZE_EXPANDED = 68 as const
export const BAR_OUTER_GAP = 8 as const
// Vertical gap between the floating mini-player pill and the expanded island's
// top edge. Apple Music keeps the pill visibly detached (Issue #153), so the pill
// floats higher above the islands row than the horizontal BAR_OUTER_GAP between
// the islands themselves.
export const BAR_PILL_ROW_GAP = 12 as const
// Side inset of the floating chrome while the bar is expanded (detached mini
// pill, wide tab island, or an open search field). Equal to the sliders' left
// rest inset, so the islands and the slider cards share one vertical line.
export const BAR_SIDE_INSET_EXPANDED = SLIDER_REST_INSET
// Side inset of the one-line bar (mini pill folded into the row): 1.5× the
// expanded inset, so the collapsed row reads visibly narrower than the cards.
export const BAR_SIDE_INSET_COLLAPSED = (BAR_SIDE_INSET_EXPANDED * 3) / 2
/**
 * Outer side inset of the bottom chrome at a given one-line morph progress.
 * Worklet-safe: called from the animated styles of the tab row, the search
 * pill and the mini pill.
 * @param oneLineProgress - 0 = expanded bar, 1 = bar collapsed to one line.
 */
export const getBarSideInset = (oneLineProgress: number): number => {
  'worklet'
  const progress = Math.min(Math.max(oneLineProgress, 0), 1)

  return BAR_SIDE_INSET_EXPANDED + (BAR_SIDE_INSET_COLLAPSED - BAR_SIDE_INSET_EXPANDED) * progress
}
// Bottom clearance below the islands for inset-less screens that still need it
// (desktop web, mobile browsers, and the early native frames before insets are
// measured). A real inset places the islands flush on the safe-area line instead.
export const BAR_BOTTOM_INSET_MIN = 12 as const
// Bottom padding of the floating chrome: with a real bottom inset the islands
// sit exactly on the safe-area line (no extra distance); inset-less screens keep
// the clearance floor.
export const getBarBottomPadding = (bottomInset: number): number =>
  bottomInset > 0 ? bottomInset : BAR_BOTTOM_INSET_MIN
// Scroll offset past which the bar collapses to a single row.
export const COLLAPSE_SCROLL_THRESHOLD = 80 as const
// Scroll offset at or above which the collapsed bar expands back.
export const EXPAND_TOP_THRESHOLD = 4 as const
export const BAR_MORPH_DURATION_MS = 300 as const
