interface IslandLayout {
  collapsedWidth: number
  expandedWidth: number
}

interface TabSlotLayout {
  collapsedWidth: number
  expandedWidth: number
  isActive: boolean
}

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
