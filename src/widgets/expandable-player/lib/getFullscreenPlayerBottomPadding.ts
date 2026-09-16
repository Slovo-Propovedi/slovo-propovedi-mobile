// Mirrors CustomTabBar's MIN_TAB_BAR_BOTTOM_PADDING so the fullscreen player
// controls sit at the same level as the tab bar buttons in every nav mode.
// Keep in sync with src/widgets/tab-bar/ui/CustomTabBar.tsx.
const MIN_BOTTOM_PADDING = 30

export const getFullscreenPlayerBottomPadding = (bottomInset: number): number =>
  Math.max(bottomInset, MIN_BOTTOM_PADDING)
