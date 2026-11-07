import { type PropsWithChildren } from 'react'
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { useTheme } from 'shared/ui/theme'
import { TouchableButton } from 'shared/ui/touchable-button'
import { getCircleButtonStyle } from '../lib/getIslandStyle'
import { ISLAND_BACKGROUND_DARK, ISLAND_BACKGROUND_LIGHT, styles } from './styles'

// Circular action floating beside the tab island (Apple-Music-style search chip).
// Its diameter follows the bar morph so it matches the island height in both states.
export const CircleButton = ({
  accessibilityLabel,
  children,
  onPress,
  progress,
}: PropsWithChildren<{
  accessibilityLabel: string
  onPress: () => void
  progress: SharedValue<number>
}>) => {
  const { isLight } = useTheme()
  const animatedStyle = useAnimatedStyle(() => getCircleButtonStyle(progress.value))

  return (
    <Animated.View style={[styles.circleButton, animatedStyle]}>
      <TouchableButton
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityLabel={accessibilityLabel}
        style={[
          styles.circleButtonFill,
          { backgroundColor: isLight ? ISLAND_BACKGROUND_LIGHT : ISLAND_BACKGROUND_DARK },
        ]}
      >
        {children}
      </TouchableButton>
    </Animated.View>
  )
}
