import { useMemo } from 'react'
import { getSearchIslandRestingStyles } from './getSearchIslandRestingStyles'

interface SearchIslandRestingInput {
  screenWidth: number
  settledClose: boolean
  settledFocused: boolean
  /** Compact row only: hides the circle while the tab island is expanded. */
  settledIslandCollapsed?: boolean
  settledOneLine: boolean
  settledOpen: boolean
  tabBarHeight: number
}

// Memoized settled counterpart of the morph's animated frame: the glass theme
// remount re-commits first-render shadow-tree values, so the pill must not fall
// back to its launch geometry (Issue #63). The settled flags lag their morphs,
// so mid-morph this layer carries the START frame instead of the destination.
export const useSearchIslandRestingStyles = ({
  screenWidth,
  settledClose,
  settledFocused,
  settledIslandCollapsed,
  settledOneLine,
  settledOpen,
  tabBarHeight,
}: SearchIslandRestingInput) =>
  useMemo(
    () =>
      getSearchIslandRestingStyles({
        screenWidth,
        settledClose,
        settledFocused,
        settledIslandCollapsed,
        settledOneLine,
        settledOpen,
        tabBarHeight,
      }),
    [
      settledIslandCollapsed,
      settledClose,
      settledFocused,
      settledOneLine,
      settledOpen,
      screenWidth,
      tabBarHeight,
    ],
  )
