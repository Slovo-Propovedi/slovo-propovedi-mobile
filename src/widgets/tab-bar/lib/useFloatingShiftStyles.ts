import { useWindowDimensions } from 'react-native'
import {
  BAR_ROW_MIN_HEIGHT,
  BAR_TOP_ISLAND_MARGIN,
  useBarBottomPadding,
  useChromeLayoutShift,
  useKeyboardLiftStyle,
} from 'shared/ui/layout'

/**
 * Chrome slide of the tab bar between its two anchors: the compact bottom
 * anchor (its top edge sits one islands row above the screen bottom) and the
 * wide top anchor (safe-area line plus the island margin). The shift is composed
 * into the keyboard lift, so the compact wrapper keeps tracking the keyboard.
 * @param topInset - Safe-area top inset the wide anchor hangs from.
 */
export const useFloatingShiftStyles = (topInset: number) => {
  const { height: screenHeight } = useWindowDimensions()
  const bottomPadding = useBarBottomPadding()
  const bottomAnchorTop = screenHeight - bottomPadding - BAR_ROW_MIN_HEIGHT
  const distance = bottomAnchorTop - (topInset + BAR_TOP_ISLAND_MARGIN)
  const { shiftStyle, translateY } = useChromeLayoutShift({ distance, wideAnchorSign: 1 })

  return { keyboardLiftStyle: useKeyboardLiftStyle(translateY), shiftStyle }
}
