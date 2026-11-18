// Geometry of the Apple-Music-style floating bottom bar: the mini player sits in
// a rounded island above the tab-bar island, and both collapse into one row.
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
// Generous side margins of the floating chrome (tab bar and resting mini
// player). 20 keeps the islands slightly narrower than the screen (Issue #153).
export const BAR_SIDE_INSET = 20 as const
// Bottom clearance below the islands for inset-less screens that still need it
// (desktop web, and the early native frames before insets are measured). A real
// inset places the islands flush on the safe-area line instead, and mobile web
// opts out of the floor entirely so the islands sit on the viewport bottom.
export const BAR_BOTTOM_INSET_MIN = 12 as const
// Bottom padding of the floating chrome: with a real bottom inset the islands
// sit exactly on the safe-area line (no extra distance). Inset-less screens keep
// the clearance floor only when `applyFloor` — `useBarBottomPadding` decides it
// (native and desktop web yes, mobile web no).
export const getBarBottomPadding = (bottomInset: number, applyFloor = true): number =>
  bottomInset > 0 ? bottomInset : applyFloor ? BAR_BOTTOM_INSET_MIN : 0
// Scroll offset past which the bar collapses to a single row.
export const COLLAPSE_SCROLL_THRESHOLD = 80 as const
// Scroll offset at or above which the collapsed bar expands back.
export const EXPAND_TOP_THRESHOLD = 4 as const
export const BAR_MORPH_DURATION_MS = 300 as const
