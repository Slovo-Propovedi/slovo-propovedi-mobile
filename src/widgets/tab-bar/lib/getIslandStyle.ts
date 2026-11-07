import {
  BAR_CIRCLE_SIZE,
  BAR_CIRCLE_SIZE_EXPANDED,
  TAB_BAR_ISLAND_HEIGHT,
  TAB_BAR_ISLAND_HEIGHT_EXPANDED,
} from 'shared/ui/layout'
import { MIN_TOUCH_TARGET } from 'shared/ui/theme'

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
// Space the island keeps between its edge and every tab item; the item grows
// with the island so the label keeps the same bottom inset in both states.
export const TAB_ITEM_VERTICAL_MARGIN = 4
// Horizontal inset between the island's rounded edge and the tab row. The
// reference frames inset the first slot by 12dp at the 76dp island height; the
// extra 4dp compensates for the narrower phone slots so the first/last labels
// still clear the rounded edge once the 12dp inter-item gap is carved out.
export const ISLAND_CONTENT_PADDING_HORIZONTAL = 16
// Gap between neighbouring tabs, split into equal margins on both items.
export const TAB_ITEM_GAP = 12
// The active capsule is wider than its slot (the reference capsule is 143dp
// over a 132dp pitch), so it bleeds into the gap instead of hugging the label.
// On a phone-width slot this leaves the ~14-18dp label padding of the frames.
export const CAPSULE_HORIZONTAL_OVERHANG = 12

const clampProgress = (progress: number) => Math.min(Math.max(progress, 0), 1)

// 0 = expanded, 1 = collapsed.
const interpolateSize = (expanded: number, collapsed: number, progress: number) =>
  collapsed + (expanded - collapsed) * (1 - progress)

const getIslandHeight = (progress: number) =>
  interpolateSize(TAB_BAR_ISLAND_HEIGHT_EXPANDED, TAB_BAR_ISLAND_HEIGHT, progress)

// Width and height of the tab island: full row width and the expanded height
// when open, a circle when collapsed.
export const getIslandStyle = (progress: number, layout: IslandLayout) => {
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
export const getIslandContentPadding = (progress: number) =>
  ISLAND_CONTENT_PADDING_HORIZONTAL * (1 - clampProgress(progress))

// Vertical shift of the icon during the morph: lifted in the expanded bar to
// leave room for the label, exactly centred (0) inside the collapsed circle.
export const getTabIconOffset = (progress: number) => {
  const clamped = clampProgress(progress)

  if (clamped === 1) return 0

  return TAB_ICON_EXPANDED_OFFSET * (1 - clamped)
}

// The item fills the island minus its vertical margins, so the taller expanded
// island gives the icon and label a clean vertical gap.
export const getTabItemHeight = (progress: number) =>
  getIslandHeight(clampProgress(progress)) - TAB_ITEM_VERTICAL_MARGIN * 2

// The primary capsule belongs to the expanded bar only: the collapsed circle
// shows just the active icon, without the pill highlight behind it.
export const getCapsuleOpacity = (progress: number, isActive: boolean) =>
  isActive ? 1 - clampProgress(progress) : 0

// The circular search chip grows and shrinks with the island, staying perfectly
// round at every point of the morph.
export const getCircleButtonStyle = (progress: number) => {
  const diameter = interpolateSize(
    BAR_CIRCLE_SIZE_EXPANDED,
    BAR_CIRCLE_SIZE,
    clampProgress(progress),
  )

  return { borderRadius: diameter / 2, height: diameter, width: diameter }
}
