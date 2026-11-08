import { BAR_CIRCLE_SIZE, BAR_CIRCLE_SIZE_EXPANDED } from 'shared/ui/layout'
import { MIN_TOUCH_TARGET } from 'shared/ui/theme'
import { clampProgress, getIslandHeight, interpolateSize } from './getIslandMath'

interface IslandLayout {
  collapsedHeight: number
  collapsedWidth: number
  expandedHeight: number
  expandedWidth: number
}

interface TabSlotLayout {
  collapsedWidth: number
  expandedWidth: number
  isActive: boolean
}

// The expanded tab stacks the label under the icon, so the icon sits this much
// above the slot centre. Collapsed, the label leaves the layout entirely and the
// icon must land exactly in the circle centre.
const TAB_ICON_EXPANDED_OFFSET = -8
// Space the collapsed island keeps between its edge and the tab item. The
// expanded bar uses a slightly larger margin (getTabItemVerticalMargin) so the
// capsule has the same breathing room vertically as horizontally.
const TAB_ITEM_VERTICAL_MARGIN = 4
const TAB_ITEM_VERTICAL_MARGIN_EXPANDED = 6
// Horizontal inset between the island's rounded edge and the tab row.
export const ISLAND_CONTENT_PADDING_HORIZONTAL = 12
// Gap between neighbouring tabs, split into equal margins on both items.
const TAB_ITEM_GAP = 10
// The active capsule is wider than its slot (the reference capsule is wider
// than one tab pitch), so it bleeds into the gap instead of hugging the label.
export const CAPSULE_HORIZONTAL_OVERHANG = 10

// Width and height of the tab island: full row width and the expanded height
// when open, a circle when collapsed.
export const getIslandStyle = (progress: number, layout: IslandLayout) => {
  'worklet'
  const clamped = clampProgress(progress)

  return {
    height: getIslandHeight(clamped),
    width: interpolateSize(layout.expandedWidth, layout.collapsedWidth, clamped),
  }
}

// Per-tab width/opacity during the morph. The active tab grows into the circle;
// the rest shrink to zero width while crossfading out, so the island's inner row
// always sums to the animated island width.
export const getTabSlotStyle = (progress: number, layout: TabSlotLayout) => {
  'worklet'
  const clamped = clampProgress(progress)

  return {
    // Fades to 0 together with the inactive slots so a zero-width collapsed slot
    // never keeps an invisible 48dp hit area next to the circle.
    minWidth: MIN_TOUCH_TARGET * (1 - clamped),
    opacity: layout.isActive ? 1 : 1 - clamped,
    width: layout.isActive
      ? layout.collapsedWidth + (layout.expandedWidth - layout.collapsedWidth) * (1 - clamped)
      : layout.expandedWidth * (1 - clamped),
  }
}

// Horizontal padding of the island's inner row: full inset when expanded, none
// when collapsed, because the active slot then fills the whole 64dp circle.
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

// Vertical margin around a tab item: the expanded bar gives the capsule more
// breathing room, while the collapsed circle keeps the compact 4dp margin so
// the item height stays 56 and the icon stays centred.
export const getTabItemVerticalMargin = (progress: number) => {
  'worklet'
  return (
    TAB_ITEM_VERTICAL_MARGIN +
    (TAB_ITEM_VERTICAL_MARGIN_EXPANDED - TAB_ITEM_VERTICAL_MARGIN) * (1 - clampProgress(progress))
  )
}

// Vertical shift of the icon during the morph: lifted in the expanded bar to
// leave room for the label, exactly centred (0) inside the collapsed circle.
export const getTabIconOffset = (progress: number) => {
  'worklet'
  const clamped = clampProgress(progress)

  if (clamped === 1) return 0

  return TAB_ICON_EXPANDED_OFFSET * (1 - clamped)
}

// The item fills the island minus its vertical margins, so the taller expanded
// island gives the icon and label a clean vertical gap.
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

// The circular search chip grows and shrinks with the island, staying perfectly
// round at every point of the morph.
export const getCircleButtonStyle = (progress: number) => {
  'worklet'
  const diameter = interpolateSize(
    BAR_CIRCLE_SIZE_EXPANDED,
    BAR_CIRCLE_SIZE,
    clampProgress(progress),
  )

  return { borderRadius: diameter / 2, height: diameter, width: diameter }
}
