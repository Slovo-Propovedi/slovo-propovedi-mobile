import { useEffect, useState } from 'react'
import { Animated, Easing, View } from 'react-native'
import { COLORS } from '../theme/colors'
import { useTheme } from '../theme/ThemeContext/useTheme'

const BAR_COUNT = 3
const BAR_HEIGHT = 12
const BAR_WIDTH = 3
const BAR_SPACING = 2
const MIN_SCALE = 0.3
const MAX_SCALE = 1

export const AnimatedSoundBars = () => {
  const { currentTheme } = useTheme()
  const [animatedValues] = useState(() =>
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.5)),
  )

  useEffect(() => {
    const animations = animatedValues.map((value, index) => {
      const duration = 800 + index * 100

      return Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
            toValue: MAX_SCALE,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
            toValue: MIN_SCALE,
            useNativeDriver: true,
          }),
        ]),
      )
    })

    animations.forEach(anim => anim.start())

    return () => {
      animations.forEach(anim => anim.stop())
    }
  }, [animatedValues])

  const containerWidth = (BAR_COUNT - 1) * (BAR_WIDTH + BAR_SPACING) + BAR_WIDTH

  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: currentTheme.primary,
        borderRadius: 12,
        height: 24,
        justifyContent: 'center',
        width: 24,
      }}
    >
      <View
        style={{
          alignItems: 'flex-end',
          flexDirection: 'row',
          height: BAR_HEIGHT,
          width: containerWidth,
        }}
      >
        {animatedValues.map((value, index) => (
          <Animated.View
            key={index}
            testID={`sound-bar-${index}`}
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 1,
              height: BAR_HEIGHT,
              marginRight: index < BAR_COUNT - 1 ? BAR_SPACING : 0,
              transform: [{ scaleY: value }],
              transformOrigin: 'bottom',
              width: BAR_WIDTH,
            }}
          />
        ))}
      </View>
    </View>
  )
}
