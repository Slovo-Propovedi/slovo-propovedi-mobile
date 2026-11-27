import { getIslandContentStyle } from './getBarMorphStyles'
import { getIslandStyle } from './getIslandStyle'

interface TabIslandRestingInput {
  expandedWidth: number
  isWideLayout?: boolean
  settledFocused: boolean
  settledIsCollapsed: boolean
  settledOneLine: boolean
}

// Non-animated resting geometry of the tab island for the settled bar state.
// Committed through the React shadow tree as the LAST style after the animated
// island style: the theme remount key on GlassSurface re-applies the host's
// shadow-tree props, and Reanimated commits only first-render animated values
// there — without this layer a collapsed island reverts to the expanded launch
// geometry on a system theme flip (same mechanism as Issue #63; see
// expandable-player getRestingContainerStyle).
//
// The height comes from the settled one-line flag (48 only when the bar is
// one-line), the width from the settled shape flag — a collapsed island's width
// IS that settled height, so it stays a circle.
//
// Callers must pass the state the morph has SETTLED into, not the live atoms: at
// the flip the shadow tree still carries the START form, otherwise it paints the
// destination a frame before the animated layer and visibly snaps back. At rest
// both layers agree.
export const getTabIslandRestingStyles = ({
  expandedWidth,
  isWideLayout = false,
  settledFocused,
  settledIsCollapsed,
  settledOneLine,
}: TabIslandRestingInput) => {
  const settledProgress = settledIsCollapsed ? 1 : 0

  return {
    content: getIslandContentStyle(settledProgress),
    island: getIslandStyle(
      settledProgress,
      { expandedWidth },
      settledFocused ? 1 : 0,
      settledOneLine ? 1 : 0,
      isWideLayout,
    ),
  }
}
