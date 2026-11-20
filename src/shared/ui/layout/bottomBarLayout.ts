// Geometry of the Apple-Music-style floating bottom bar: the mini player sits in
// a rounded island above the tab-bar island, and both collapse into one row.
import { SLIDER_REST_INSET } from '../slider/slider-layout.lib'
import { PLAYER_SIZES } from '../theme/themed'

export const BAR_ROW_MIN_HEIGHT = 76 as const
// The one-line row is uniform: the collapsed island and the circle both equal
// the mini player height (48). The expanded sizes (68) stay taller and morph
// down to them.
const ONE_LINE_ROW_SIZE = PLAYER_SIZES.miniPlayerHeight
export const TAB_BAR_ISLAND_HEIGHT = ONE_LINE_ROW_SIZE
export const TAB_BAR_ISLAND_HEIGHT_EXPANDED = 68 as const
// The expanded island's top edge sits this far below the row's top edge: the
// islands are anchored to the row's bottom edge (the safe-area line), so the
// gap is the unused space above the expanded island. The row's measured height
// already includes the bottom safe-area padding, which keeps the offset valid
// for any inset.
export const BAR_EXPANDED_ISLAND_TOP_MARGIN = BAR_ROW_MIN_HEIGHT - TAB_BAR_ISLAND_HEIGHT_EXPANDED
/**
 * The circle stays circular: width = height = radius * 2 at the uniform
 * one-line height, so its diameter deliberately mirrors the island height.
 */
export const BAR_CIRCLE_SIZE = ONE_LINE_ROW_SIZE
export const BAR_CIRCLE_SIZE_EXPANDED = 68 as const
export const BAR_OUTER_GAP = 8 as const
// Vertical gap between the floating mini-player pill and the expanded island's
// top edge. Apple Music keeps the pill visibly detached (Issue #153), so the pill
// floats higher above the islands row than the horizontal BAR_OUTER_GAP between
// the islands themselves.
export const BAR_PILL_ROW_GAP = 12 as const
// The expanded chrome sits 1 px off the sliders' rest line: an edge that
// coincides exactly with the slider cards' edge reads as one merged card (user
// report 2026-11-20). The collapsed one-line state keeps its original width.
const BAR_SIDE_INSET_OFFSET = 1 as const
// Side inset of the floating chrome while the bar is expanded (detached mini
// pill, wide tab island, or an open search field). 1 px right of the sliders'
// rest inset (SLIDER_REST_INSET), so the islands and the slider cards never
// share an edge line.
export const BAR_SIDE_INSET_EXPANDED = SLIDER_REST_INSET + BAR_SIDE_INSET_OFFSET
// Side inset of the one-line bar (mini pill folded into the row): 1.5× the
// sliders' rest inset — unchanged by the 1 px expanded-state offset, so the
// collapsed row keeps its original width.
export const BAR_SIDE_INSET_COLLAPSED = (SLIDER_REST_INSET * 3) / 2
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
// the clearance floor. Web browsers pass browserClearance: their inset comes
// from the unreliable env() probe, and there the safe-area line is the top edge
// of the browser chrome (iOS Safari navbar) — flush against it reads as the
// islands lying on the navbar, so the chrome keeps the clearance floor above
// it. Installed PWAs are excluded: no dynamic chrome, flush stays the look.
export const getBarBottomPadding = (bottomInset: number, browserClearance = false): number => {
  if (bottomInset <= 0) return BAR_BOTTOM_INSET_MIN

  return browserClearance ? bottomInset + BAR_BOTTOM_INSET_MIN : bottomInset
}
// Scroll offset past which the bar collapses to a single row.
export const COLLAPSE_SCROLL_THRESHOLD = 80 as const
// Scroll offset at or above which the collapsed bar expands back.
export const EXPAND_TOP_THRESHOLD = 4 as const
export const BAR_MORPH_DURATION_MS = 200 as const
