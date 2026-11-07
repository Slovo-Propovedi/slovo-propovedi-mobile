import { type ViewStyle } from 'react-native'
import Animated, { type AnimatedStyle } from 'react-native-reanimated'

/**
 * Full-window dimmed backdrop behind the player. Its size is React-committed to
 * the viewport; only opacity is animated by the expand progress.
 * @param root0 - Backdrop props.
 * @param root0.backdropStyle - Animated opacity style.
 * @param root0.screenHeight - Full viewport height.
 * @param root0.screenWidth - Current window width.
 * @param root0.style - Static backdrop style (position, color, z-index).
 */
export const PlayerBackdrop = ({
  backdropStyle,
  screenHeight,
  screenWidth,
  style,
}: {
  backdropStyle: AnimatedStyle<ViewStyle>
  screenHeight: number
  screenWidth: number
  style: ViewStyle
}) => (
  <Animated.View
    style={[
      style,
      backdropStyle,
      {
        height: Math.floor(screenHeight),
        pointerEvents: 'none',
        width: Math.floor(screenWidth),
      },
    ]}
  />
)
