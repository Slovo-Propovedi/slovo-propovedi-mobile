import { TAB_BAR_ISLAND_HEIGHT, TAB_BAR_ISLAND_HEIGHT_EXPANDED } from 'shared/ui/layout'

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

export const getIslandHeight = (progress: number) => {
  'worklet'
  return interpolateSize(TAB_BAR_ISLAND_HEIGHT_EXPANDED, TAB_BAR_ISLAND_HEIGHT, progress)
}
