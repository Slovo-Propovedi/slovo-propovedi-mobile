import {
  BAR_ROW_MIN_HEIGHT,
  BAR_TOP_ISLAND_MARGIN,
  type useChromeLayoutShift,
  type useKeyboardLiftStyle,
  WIDE_BAR_ROW_HEIGHT,
} from 'shared/ui/layout'
import { type useRowInsetStyle } from '../lib/useRowInsetStyle'
import { styles } from './styles'

// Outer chrome wrapper: compact pins to the bottom edge and rides the keyboard;
// wide floats below the safe-area top and ignores the keyboard lift. The
// layout-shift layer carries the slide between the two anchors.
export const getFloatingContainerStyle = (
  isWide: boolean,
  topInset: number,
  keyboardLiftStyle: ReturnType<typeof useKeyboardLiftStyle>,
  shiftStyle: ReturnType<typeof useChromeLayoutShift>['shiftStyle'],
) =>
  isWide
    ? [styles.floatingContainerTop, { top: topInset + BAR_TOP_ISLAND_MARGIN }, shiftStyle]
    : [styles.floatingContainer, keyboardLiftStyle]

// Row of islands. The compact row carries the Android elevation for the island
// AND the separate search circle; the wide row stays flat so the raised shadow
// follows the floating pill (floatingIslandElevated), not a full-width band.
export const getIslandsRowStyle = (
  isWide: boolean,
  bottomPadding: number,
  insets: ReturnType<typeof useRowInsetStyle>,
) => [
  styles.islandsRow,
  // Wide hugs the island: the row only centers the narrow pill instead of
  // spreading content across the column.
  isWide && { justifyContent: 'center' as const },
  !isWide && styles.islandsRowElevated,
  {
    height: (isWide ? WIDE_BAR_ROW_HEIGHT : BAR_ROW_MIN_HEIGHT) + bottomPadding,
    paddingBottom: bottomPadding,
  },
  // Wide hugs the island: the column insets would pad a full-width row around a
  // narrow pill, so the row only centers it.
  !isWide && insets.insetStyle,
  !isWide && insets.restingInsetStyle,
]
