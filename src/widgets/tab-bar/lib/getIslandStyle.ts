import { MIN_TOUCH_TARGET } from 'shared/ui/theme'
import { clampProgress, getIslandHeight, interpolateSize } from './getIslandMath'

interface IslandLayout {
  expandedWidth: number
}

interface TabSlotLayout {
  expandedWidth: number
  isActive: boolean
}

// The expanded tab stacks the label under the icon, so the icon sits this much
// above the slot centre. Collapsed, the label leaves the layout entirely and the
// icon must land exactly in the circle centre.
const TAB_ICON_EXPANDED_OFFSET = -8
// Vertical margin around a tab item: one compact value in both bar states, so
// the expanded capsule fills the slimmer island (Issue #153) and the collapsed
// item keeps the icon centred in the circle.
const TAB_ITEM_VERTICAL_MARGIN = 4
// Horizontal inset between the island's rounded edge and the tab row. 10 keeps
// the tab labels close to the pill ends like the Apple Music bar while staying
// visually balanced with the 4dp vertical item margin (Issue #153).
export const ISLAND_CONTENT_PADDING_HORIZONTAL = 10
// Gap between neighbouring tabs, split into equal margins on both items.
const TAB_ITEM_GAP = 8
// The active capsule is wider than its slot (the reference capsule is wider
// than one tab pitch), so it bleeds into the gap instead of hugging the label.
export const CAPSULE_HORIZONTAL_OVERHANG = 10

// Width and height of the tab island.
//
// The height belongs to the one-line axis (oneLineProgress): the expanded bar is
// always 68 tall, the compact one-line bar 48. A visible search field pins the
// bar to the expanded height even when the shape collapses to a circle, so the
// open-field row shares one height between the island and the pill.
//
// The width belongs to the shape axis (progress): full row when expanded, a
// circle when collapsed. The circle's diameter IS the current height, never a
// fixed constant — 68x68 beside an open field, 48x48 in the compact row. Focus
// is a stronger state than collapse: the whole island fades out and its width
// reaches zero, handing the row to the focused search pill.
export const getIslandStyle = (
  progress: number,
  layout: IslandLayout,
  focusProgress = 0,
  oneLineProgress = 0,
) => {
  'worklet'
  const clamped = clampProgress(progress)
  const focus = clampProgress(focusProgress)
  const height = getIslandHeight(clampProgress(oneLineProgress))

  return {
    height,
    opacity: 1 - focus,
    width: interpolateSize(layout.expandedWidth, height, clamped) * (1 - focus),
  }
}

// Per-tab width/opacity during the morph. The active tab grows into the circle,
// the rest shrink to zero width while crossfading out. The collapsed slot takes
// the same height-derived width as the island, so it never paints outside it.
export const getTabSlotStyle = (progress: number, layout: TabSlotLayout, oneLineProgress = 0) => {
  'worklet'
  const clamped = clampProgress(progress)
  const collapsedWidth = getIslandHeight(clampProgress(oneLineProgress))

  return {
    // Fades to 0 together with the inactive slots so a zero-width collapsed slot
    // never keeps an invisible 48dp hit area next to the circle.
    minWidth: MIN_TOUCH_TARGET * (1 - clamped),
    opacity: layout.isActive ? 1 : 1 - clamped,
    width: layout.isActive
      ? interpolateSize(layout.expandedWidth, collapsedWidth, clamped)
      : layout.expandedWidth * (1 - clamped),
  }
}

// Horizontal padding of the island's inner row: full inset when expanded, none
// when collapsed, because the active slot then fills the whole 48dp circle.
export const getIslandContentPadding = (progress: number) => {
  'worklet'
  return ISLAND_CONTENT_PADDING_HORIZONTAL * (1 - clampProgress(progress))
}

// Half of the inter-tab gap on each side of an item. It fades out with the morph
// so the collapsed active item fills the circle instead of being pushed
// off-centre by a leftover expanded-state margin.
export const getTabItemHorizontalMargin = (progress: number) => {
  'worklet'
  return (TAB_ITEM_GAP / 2) * (1 - clampProgress(progress))
}

// Vertical margin around a tab item: one compact value in both bar states, so
// the expanded capsule fills the slimmer island and the collapsed circle keeps
// the icon centred (collapsed item height 48).
export const getTabItemVerticalMargin = (_progress: number) => {
  'worklet'

  return TAB_ITEM_VERTICAL_MARGIN
}

// Vertical shift of the icon during the morph: lifted in the expanded bar to
// leave room for the label, exactly centred (0) inside the collapsed circle.
export const getTabIconOffset = (progress: number) => {
  'worklet'
  const clamped = clampProgress(progress)

  if (clamped === 1) return 0

  return TAB_ICON_EXPANDED_OFFSET * (1 - clamped)
}

// The item follows the shape morph (the same axis as the label/capsule fade) and
// fills the island minus its vertical margins: the expanded shape makes room for
// the label, the collapsed shape keeps the icon centred in the circle.
export const getTabItemHeight = (progress: number) => {
  'worklet'
  const clamped = clampProgress(progress)

  return getIslandHeight(clamped) - getTabItemVerticalMargin(clamped) * 2
}

// The primary capsule belongs to the expanded bar only: the collapsed circle
// shows just the active icon, without the pill highlight behind it.
export const getCapsuleOpacity = (progress: number, isActive: boolean) => {
  'worklet'
  return isActive ? 1 - clampProgress(progress) : 0
}
