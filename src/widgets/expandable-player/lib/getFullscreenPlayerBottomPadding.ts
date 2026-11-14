import { BAR_BOTTOM_INSET_MIN } from 'shared/ui/layout'

// Mirrors the tab bar's bottom floor so the fullscreen player controls sit at
// the same level as the tab bar buttons in every nav mode.
export const getFullscreenPlayerBottomPadding = (bottomInset: number): number =>
  Math.max(bottomInset, BAR_BOTTOM_INSET_MIN)
