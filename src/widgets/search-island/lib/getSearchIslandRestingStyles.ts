import { getSearchIslandGeometry } from './getSearchIslandGeometry'

interface SearchIslandRestingStylesInput {
  screenWidth: number
  settledClose: boolean
  settledFocused: boolean
  settledOneLine: boolean
  settledOpen: boolean
  tabBarHeight: number
}

// Settled counterpart of the morph's animated frame.
//
// The glass theme remount re-commits first-render shadow-tree values, so the
// pill must not fall back to its launch geometry (Issue #63). The settled flags
// lag their morphs, so mid-morph this layer carries the START frame instead of
// painting the destination a frame early.
export const getSearchIslandRestingStyles = ({
  screenWidth,
  settledClose,
  settledFocused,
  settledOneLine,
  settledOpen,
  tabBarHeight,
}: SearchIslandRestingStylesInput) => {
  const settledOpenProgress = settledOpen ? 1 : 0
  const settledCloseProgress = settledClose ? 1 : 0
  const { closeRight, iconInset, iconSize, radius, ...geometry } = getSearchIslandGeometry({
    closeProgress: settledCloseProgress,
    focusProgress: settledFocused ? 1 : 0,
    oneLineProgress: settledOneLine ? 1 : 0,
    openProgress: settledOpenProgress,
    screenWidth,
    tabBarHeight,
  })

  return {
    closeSlotRestingStyle: {
      borderRadius: geometry.height / 2,
      bottom: geometry.bottom,
      height: geometry.height,
      opacity: settledOpenProgress * settledCloseProgress,
      right: closeRight,
      transform: [{ scale: 0.8 + 0.2 * settledCloseProgress }],
      width: geometry.height,
    },
    restingFrameStyle: { ...geometry, borderRadius: radius, paddingLeft: iconInset },
  }
}
