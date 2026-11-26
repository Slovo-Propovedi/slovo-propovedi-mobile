import { BAR_TOP_ISLAND_MARGIN, type useKeyboardLiftStyle } from 'shared/ui/layout'
import { styles } from './styles'

// Outer chrome wrapper: compact pins to the bottom edge and rides the keyboard;
// wide floats below the safe-area top and ignores the keyboard lift.
export const getFloatingContainerStyle = (
  isWide: boolean,
  topInset: number,
  keyboardLiftStyle: ReturnType<typeof useKeyboardLiftStyle>,
) =>
  isWide
    ? [styles.floatingContainerTop, { top: topInset + BAR_TOP_ISLAND_MARGIN }]
    : [styles.floatingContainer, keyboardLiftStyle]
