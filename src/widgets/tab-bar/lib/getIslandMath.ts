import {
  TAB_BAR_ISLAND_HEIGHT,
  TAB_BAR_ISLAND_HEIGHT_EXPANDED,
  WIDE_TAB_ISLAND_HEIGHT,
} from 'shared/ui/layout'

// Morph math shared by the island style helpers. Declared as worklets so the
// animated styles can call them on the UI thread.
export const clampProgress = (progress: number) => {
  'worklet'
  return Math.min(Math.max(progress, 0), 1)
}

// 0 = expanded, 1 = collapsed.
export const interpolateSize = (expanded: number, collapsed: number, progress: number) => {
  'worklet'
  return collapsed + (expanded - collapsed) * (1 - progress)
}

// The wide layout pins the island open but reads its own slim height: the top
// bar stays thinner than the compact expanded island (60) and the mini pill (60).
export const getIslandHeight = (progress: number, isWideLayout = false) => {
  'worklet'

  if (isWideLayout) return WIDE_TAB_ISLAND_HEIGHT

  return interpolateSize(TAB_BAR_ISLAND_HEIGHT_EXPANDED, TAB_BAR_ISLAND_HEIGHT, progress)
}
