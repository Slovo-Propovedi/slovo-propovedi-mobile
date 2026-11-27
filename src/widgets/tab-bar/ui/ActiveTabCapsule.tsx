import { type StyleProp, type ViewStyle } from 'react-native'
import Animated, { type AnimatedStyle } from 'react-native-reanimated'
import { useTheme, withAlpha } from 'shared/ui/theme'
import { styles } from './styles'

const ACTIVE_CAPSULE_ALPHA = 0.18

// Tinted capsule behind the active tab's icon and label. Extracted so the tab
// slots and the search circle paint the exact same active highlight; callers
// own the geometry (the tab capsule overhangs its slot, the circle fills the
// collapsed chip) and the animated opacity.
export const ActiveTabCapsule = ({ style }: { style?: StyleProp<AnimatedStyle<ViewStyle>> }) => {
  const { currentTheme } = useTheme()

  return (
    <Animated.View
      pointerEvents='none'
      style={[
        styles.capsule,
        { backgroundColor: withAlpha(currentTheme.primary, ACTIVE_CAPSULE_ALPHA) },
        style,
      ]}
    />
  )
}
