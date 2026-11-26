// Geometry of the Apple-Music-style floating bottom bar: the mini player sits in
// a rounded island above the tab-bar island, and both collapse into one row.
import { SLIDER_REST_INSET } from '../slider/slider-layout.lib'
import { PLAYER_SIZES } from '../theme/themed'

export const BAR_ROW_MIN_HEIGHT = 68 as const
// The one-line row is uniform: the collapsed island and the circle both equal
// the mini player height (48). The expanded sizes (60) stay taller and morph
// down to them.
const ONE_LINE_ROW_SIZE = PLAYER_SIZES.miniPlayerHeight
export const TAB_BAR_ISLAND_HEIGHT = ONE_LINE_ROW_SIZE
export const TAB_BAR_ISLAND_HEIGHT_EXPANDED = 60 as const
// The expanded island's top edge sits this far below the row's top edge: the
// islands are anchored to the row's bottom edge (the safe-area line), so the
// gap is the unused space above the expanded island. The row's measured height
// already includes the bottom safe-area padding, which keeps the offset valid
// for any inset.
export const BAR_EXPANDED_ISLAND_TOP_MARGIN = BAR_ROW_MIN_HEIGHT - TAB_BAR_ISLAND_HEIGHT_EXPANDED
// Top margin of the floating chrome in the wide layout, where the tab-bar island
// floats at the top of the screen: a small gap below the safe-area line that
// matches the islands' outer gap.
export const BAR_TOP_ISLAND_MARGIN = 8 as const
/**
 * The circle stays circular: width = height = radius * 2 at the uniform
 * one-line height, so its diameter deliberately mirrors the island height.
 */
export const BAR_CIRCLE_SIZE = ONE_LINE_ROW_SIZE
// Deliberately mirrors TAB_BAR_ISLAND_HEIGHT_EXPANDED (60) — the circle diameter IS the
// expanded island height; keep in sync.
export const BAR_CIRCLE_SIZE_EXPANDED = 60 as const
export const BAR_OUTER_GAP = 8 as const
// Vertical gap between the floating mini-player pill and the expanded island's
// top edge. Apple Music keeps the pill visibly detached (Issue #153), so the pill
// floats higher above the islands row than the horizontal BAR_OUTER_GAP between
// the islands themselves.
export const BAR_PILL_ROW_GAP = 8 as const
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
// Equals BAR_SIDE_INSET_EXPANDED (25) — the web bottom gap mirrors the expanded chrome
// side insets; keep in sync.
const BAR_BOTTOM_INSET_WEB = 25 as const
// Gap between the islands and the physical screen bottom on iOS web. Apple's
// home-indicator bar (5 px tall) occupies [8, 13] px above the screen bottom; a
// 21 dp gap leaves 8 px below the indicator and 8 px above it, so the indicator
// is vertically centered in this gap. The shell is `100lvh` — the full physical
// screen — via the `ios-web` class set by ensureIosWebShellClass; the earlier
// dvh shortfall is what letterboxed the page. The home indicator lives inside
// this gap, so the env() probe is deliberately ignored: it double-counts the OS
// band whenever it reports one.
export const IOS_WEB_ISLANDS_GAP = 21 as const
// Bottom padding of the floating chrome: on web the visible bottom gap is at
// least BAR_BOTTOM_INSET_WEB (the expanded chrome's side insets on
// desktop/Android); max() lets a larger real inset (installed PWA safe-area
// line) win; native keeps flush-on-inset and the 12 floor only for inset-less
// early frames.
export const getBarBottomPadding = (bottomInset: number, isWeb = false): number => {
  if (!isWeb) return bottomInset > 0 ? bottomInset : BAR_BOTTOM_INSET_MIN

  return Math.max(bottomInset, BAR_BOTTOM_INSET_WEB)
}
// Scroll offset past which the bar collapses to a single row.
export const COLLAPSE_SCROLL_THRESHOLD = 80 as const
// Scroll offset at or above which the collapsed bar expands back.
export const EXPAND_TOP_THRESHOLD = 4 as const
export const BAR_MORPH_DURATION_MS = 200 as const
// Viewport width at or above which the app switches to the tablet/desktop wide
// layout. Below it the phone layout is kept.
export const WIDE_LAYOUT_MIN_WIDTH = 768 as const
// Shortest-side threshold of the wide layout: the window must be tablet-class in
// BOTH dimensions, so a phone in landscape (844×390) keeps the phone layout.
export const WIDE_LAYOUT_MIN_SHORTEST_SIDE = 600 as const
