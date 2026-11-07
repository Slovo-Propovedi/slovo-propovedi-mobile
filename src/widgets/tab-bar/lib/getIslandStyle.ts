interface IslandLayout {
  collapsedWidth: number
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

const clampProgress = (progress: number) => Math.min(Math.max(progress, 0), 1)

// Width of the tab island: full row width when expanded, a circle when collapsed.
export const getIslandStyle = (progress: number, layout: IslandLayout) => {
  const clamped = clampProgress(progress)

  return {
    width: layout.expandedWidth + (layout.collapsedWidth - layout.expandedWidth) * clamped,
  }
}

// Per-tab width/opacity during the morph. The active tab grows into the circle;
// the rest shrink to zero width while crossfading out, so the island's inner row
// always sums to the animated island width.
export const getTabSlotStyle = (progress: number, layout: TabSlotLayout) => {
  const clamped = clampProgress(progress)

  return {
    opacity: layout.isActive ? 1 : 1 - clamped,
    width: layout.isActive
      ? layout.collapsedWidth + (layout.expandedWidth - layout.collapsedWidth) * (1 - clamped)
      : layout.expandedWidth * (1 - clamped),
  }
}

// Vertical shift of the icon during the morph: lifted in the expanded bar to
// leave room for the label, exactly centred (0) inside the collapsed circle.
export const getTabIconOffset = (progress: number) => {
  const clamped = clampProgress(progress)

  if (clamped === 1) return 0

  return TAB_ICON_EXPANDED_OFFSET * (1 - clamped)
}
