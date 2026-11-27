import { FONT_SIZES, MIN_TOUCH_TARGET } from 'shared/ui/theme'
import { clampProgress, getIslandHeight, interpolateSize } from './getIslandMath'

interface IslandLayout {
  expandedWidth: number
}

interface TabSlotLayout {
  expandedWidth: number
  isActive: boolean
}

// Horizontal inset between the island's rounded edge and the tab row. 10 keeps
// the tab labels close to the pill ends like the Apple Music bar while staying
// visually balanced with the 4dp vertical item margin (Issue #153).
export const ISLAND_CONTENT_PADDING_HORIZONTAL = 10
// The active capsule is wider than its slot (the reference capsule is wider
// than one tab pitch), so it bleeds into the gap instead of hugging the label.
export const CAPSULE_HORIZONTAL_OVERHANG = 10
// Natural width of one wide tab slot. Wide tabs drop the icon and render only
// their label at WIDE_TAB_LABEL_SIZE, so the slot is sized to the widest label
// («Слушать» ≈ 63dp at 16/500). The 1.2 max font-scale multiplier needs ~76dp,
// plus the item's 4dp horizontal margin on each side = ~84dp; 88 leaves a
// breathing gap without clipping. RU-first fixed pitch — longer localizations
// would need runtime text measurement.
export const WIDE_TAB_SLOT_WIDTH = 88
// Wide search is icon-only, so its slot only owes the minimum touch target.
export const WIDE_SEARCH_SLOT_WIDTH = MIN_TOUCH_TARGET
// Wide tab labels replace the icon in the slim 48dp island. 16 fits the 40dp
// item box (48 minus the two 4dp vertical margins) even at 1.2 font scale.
export const WIDE_TAB_LABEL_SIZE = FONT_SIZES.md

// Natural width of the wide pill: label slots for the visible tabs plus the
// icon-only search slot, with the island's inner paddings.
export const getWideIslandWidth = (routeCount: number, hasSearch: boolean) =>
  ISLAND_CONTENT_PADDING_HORIZONTAL * 2 +
  routeCount * WIDE_TAB_SLOT_WIDTH +
  (hasSearch ? WIDE_SEARCH_SLOT_WIDTH : 0)

// Width and height of the tab island.
//
// The height belongs to the one-line axis (oneLineProgress): the expanded bar is
// always 60 tall, the compact one-line bar 48. A visible search field pins the
// bar to the expanded height even when the shape collapses to a circle, so the
// open-field row shares one height between the island and the pill.
//
// The width belongs to the shape axis (progress): full row when expanded, a
// circle when collapsed. The circle's diameter IS the current height, never a
// fixed constant — 60x60 beside an open field, 48x48 in the compact row. Focus
// is a stronger state than collapse: the whole island fades out and its width
// reaches zero, handing the row to the focused search pill.
export const getIslandStyle = (
  progress: number,
  layout: IslandLayout,
  focusProgress = 0,
  oneLineProgress = 0,
  isWideLayout = false,
) => {
  'worklet'
  const clamped = clampProgress(progress)
  const focus = clampProgress(focusProgress)
  const height = getIslandHeight(clampProgress(oneLineProgress), isWideLayout)

  return {
    height,
    opacity: 1 - focus,
    width: interpolateSize(layout.expandedWidth, height, clamped) * (1 - focus),
  }
}

// Per-tab width/opacity during the morph. The active tab grows into the circle,
// the rest shrink to zero width while crossfading out. The collapsed slot takes
// the same height-derived width as the island, so it never paints outside it.
//
// The slot height always matches the island height (one-line axis), never the
// shape axis: beside an open search field the island is a 60 circle on a
// collapsed shape, and a slot sized from the 48 one-line row would centre its
// item 6dp above the circle centre.
export const getTabSlotStyle = (
  progress: number,
  layout: TabSlotLayout,
  oneLineProgress = 0,
  isWideLayout = false,
) => {
  'worklet'
  const clamped = clampProgress(progress)
  const islandHeight = getIslandHeight(clampProgress(oneLineProgress), isWideLayout)

  return {
    // Fades to 0 together with the inactive slots so a zero-width collapsed slot
    // never keeps an invisible 48dp hit area next to the circle.
    height: islandHeight,
    minWidth: MIN_TOUCH_TARGET * (1 - clamped),
    opacity: layout.isActive ? 1 : 1 - clamped,
    width: layout.isActive
      ? interpolateSize(layout.expandedWidth, islandHeight, clamped)
      : layout.expandedWidth * (1 - clamped),
  }
}

// Horizontal padding of the island's inner row: full inset when expanded, none
// when collapsed, because the active slot then fills the whole 48dp circle.
export const getIslandContentPadding = (progress: number) => {
  'worklet'
  return ISLAND_CONTENT_PADDING_HORIZONTAL * (1 - clampProgress(progress))
}
