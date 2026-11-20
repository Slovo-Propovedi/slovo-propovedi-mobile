import { clampProgress, getIslandHeight } from './getIslandMath'

// The expanded tab stacks the label under the icon, so the icon sits this much
// above the slot centre. Collapsed, the label leaves the layout entirely and the
// icon must land exactly in the circle centre.
const TAB_ICON_EXPANDED_OFFSET = -8
// Vertical margin around a tab item: one compact value in both bar states, so
// the expanded capsule fills the slimmer island (Issue #153) and the collapsed
// item keeps the icon centred in the circle.
const TAB_ITEM_VERTICAL_MARGIN = 4
// Gap between neighbouring tabs, split into equal margins on both items.
const TAB_ITEM_GAP = 8

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

// The item fills the island minus its vertical margins on the one-line (height)
// axis: 60 in the 68 island (expanded bar and search-open circle), 40 in the 48
// compact row. Reading the shape axis instead left the search-open item 40 tall
// inside a 68 circle, resting above its centre.
export const getTabItemHeight = (oneLineProgress: number) => {
  'worklet'
  const clamped = clampProgress(oneLineProgress)

  return getIslandHeight(clamped) - getTabItemVerticalMargin(clamped) * 2
}

// The primary capsule belongs to the expanded bar only: the collapsed circle
// shows just the active icon, without the pill highlight behind it.
export const getCapsuleOpacity = (progress: number, isActive: boolean) => {
  'worklet'
  return isActive ? 1 - clampProgress(progress) : 0
}
