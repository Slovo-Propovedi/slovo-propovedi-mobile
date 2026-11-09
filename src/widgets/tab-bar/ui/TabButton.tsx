import { Text } from 'react-native'
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { useTheme, withAlpha } from 'shared/ui/theme'
import { TouchableButton } from 'shared/ui/touchable-button'
import { getTabItemStyle } from '../lib/getBarMorphStyles'
import { getCapsuleOpacity, getTabIconOffset } from '../lib/getIslandStyle'
import { styles } from './styles'
import { TabIcon } from './TabIcon'
import { getTabLabel } from './tabLabels'

const ACTIVE_CAPSULE_ALPHA = 0.18
const AnimatedText = Animated.createAnimatedComponent(Text)

export const TabButton = ({
  collapseProgress,
  isActive,
  isDisabled,
  onPress,
  routeKey,
  routeName,
}: {
  // Shared 0..1 bar-morph progress: labels fade out as the island becomes a circle.
  collapseProgress?: SharedValue<number>
  isActive: boolean
  isDisabled?: boolean
  onPress: () => void
  routeKey: string
  routeName: string
}) => {
  const { currentTheme } = useTheme()
  const fallbackProgress = useSharedValue(0)
  const labelProgress = collapseProgress ?? fallbackProgress
  const labelStyle = useAnimatedStyle(() => ({ opacity: 1 - labelProgress.value }))
  const itemStyle = useAnimatedStyle(() => getTabItemStyle(labelProgress.value))
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: getTabIconOffset(labelProgress.value) }],
  }))
  const capsuleStyle = useAnimatedStyle(() => ({
    opacity: getCapsuleOpacity(labelProgress.value, isActive),
  }))
  const color = isDisabled
    ? currentTheme.textMuted
    : isActive
      ? currentTheme.primary
      : currentTheme.text

  return (
    <TouchableButton
      key={routeKey}
      onPress={onPress}
      hapticDisabled={isActive}
      activeOpacity={isActive ? 1 : undefined}
      style={[styles.tabButton, isDisabled && styles.disabledTabButton]}
    >
      <Animated.View style={[styles.tabItem, itemStyle]}>
        {isActive && (
          <Animated.View
            pointerEvents='none'
            style={[
              styles.capsule,
              { backgroundColor: withAlpha(currentTheme.primary, ACTIVE_CAPSULE_ALPHA) },
              capsuleStyle,
            ]}
          />
        )}
        <Animated.View style={iconStyle}>
          <TabIcon color={color} isActive={isActive} routeName={routeName} />
        </Animated.View>
        <AnimatedText
          numberOfLines={1}
          maxFontSizeMultiplier={1.2}
          style={[styles.tabText, { color }, labelStyle]}
        >
          {getTabLabel(routeName)}
        </AnimatedText>
      </Animated.View>
    </TouchableButton>
  )
}
