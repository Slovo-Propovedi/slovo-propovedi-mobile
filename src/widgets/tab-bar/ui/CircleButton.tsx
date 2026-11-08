import { type PropsWithChildren } from 'react'
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { createGlassStyles, GlassSurface } from 'shared/ui'
import { RADIUSES, useTheme } from 'shared/ui/theme'
import { TouchableButton } from 'shared/ui/touchable-button'
import { getCircleButtonStyle } from '../lib/getIslandStyle'
import { styles } from './styles'

// Circular action floating beside the tab island (Apple-Music-style search chip).
// Its diameter follows the bar morph so it matches the island height in both states.
export const CircleButton = ({
  accessibilityLabel,
  children,
  hasShadow,
  onPress,
  progress,
}: PropsWithChildren<{
  accessibilityLabel: string
  /** Off while the search pill still owns the row's single shadow. */
  hasShadow: boolean
  onPress: () => void
  progress: SharedValue<number>
}>) => {
  const { isLight } = useTheme()
  const glass = createGlassStyles(isLight, RADIUSES.round)
  const animatedStyle = useAnimatedStyle(() => getCircleButtonStyle(progress.value))

  return (
    <Animated.View style={[styles.circleButton, hasShadow && glass.container, animatedStyle]}>
      <TouchableButton
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.circleButtonFill}
        accessibilityLabel={accessibilityLabel}
      >
        <GlassSurface isLight={isLight} radius={RADIUSES.round} />
        {children}
      </TouchableButton>
    </Animated.View>
  )
}
