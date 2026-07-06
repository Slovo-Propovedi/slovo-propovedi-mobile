import { useEffect, useRef } from 'react'
import { Animated, Easing, View } from 'react-native'
import { COLORS } from 'shared/ui/themed'

const BAR_COUNT = 3
const BAR_WIDTH = 3
const BAR_SPACING = 2

export const AnimatedSoundBars = () => {
  const animatedValues = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.5)),
  ).current

  useEffect(() => {
    const animations = animatedValues.map((value, index) => {
      const duration = 800 + index * 100

      return Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
            toValue: 1,
            useNativeDriver: false,
          }),
          Animated.timing(value, {
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
            toValue: 0.3,
            useNativeDriver: false,
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
        backgroundColor: COLORS.primary,
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
          height: 12,
          width: containerWidth,
        }}
      >
        {animatedValues.map((value, index) => (
          <Animated.View
            key={index}
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 1,
              height: value.interpolate({
                inputRange: [0.3, 1],
                outputRange: [3, 12],
              }),
              marginRight: index < BAR_COUNT - 1 ? BAR_SPACING : 0,
              width: BAR_WIDTH,
            }}
          />
        ))}
      </View>
    </View>
  )
}
