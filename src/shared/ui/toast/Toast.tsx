import { useAtom } from '@reatom/npm-react'
import { useEffect } from 'react'
import { StyleSheet, Text } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { toastAtom } from 'shared/model'
import { FONT_SIZES, INDENTS, RADIUSES, useTheme } from 'shared/ui/theme'

const FADE_DURATION_MS = 300

export const Toast = () => {
  const [message] = useAtom(toastAtom)
  const { currentTheme } = useTheme()
  const insets = useSafeAreaInsets()
  const opacity = useSharedValue(0)

  useEffect(() => {
    opacity.value = withTiming(message ? 1 : 0, { duration: FADE_DURATION_MS })
  }, [message, opacity])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  if (!message) return null

  return (
    <Animated.View
      accessibilityRole='alert'
      accessibilityLiveRegion='polite'
      style={[
        styles.container,
        animatedStyle,
        {
          backgroundColor: currentTheme.surface,
          pointerEvents: 'none',
          top: insets.top + INDENTS.medium,
        },
      ]}
    >
      <Text style={[styles.text, { color: currentTheme.text }]}>{message}</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    borderRadius: RADIUSES.round,
    elevation: 8,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.low,
    position: 'absolute',
    zIndex: 100,
  },
  text: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
})
