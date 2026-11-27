import { type StyleProp, type ViewStyle } from 'react-native'
import Animated, { type AnimatedStyle } from 'react-native-reanimated'
import { useTheme, withAlpha } from 'shared/ui/theme'
import { highlightStyles } from './highlightStyles'

const ACTIVE_CAPSULE_ALPHA = 0.18

// Tinted capsule behind the active tab's icon and label. Extracted so the tab
// row and the search circle paint the exact same active highlight; callers own
// the geometry (the traveling capsule spans the slot, the circle fills the
// collapsed chip) and the animated style.
export const ActiveTabCapsule = ({ style }: { style?: StyleProp<AnimatedStyle<ViewStyle>> }) => {
  const { currentTheme } = useTheme()

  return (
    <Animated.View
      pointerEvents='none'
      style={[
        highlightStyles.capsule,
        { backgroundColor: withAlpha(currentTheme.primary, ACTIVE_CAPSULE_ALPHA) },
        style,
      ]}
    />
  )
}
