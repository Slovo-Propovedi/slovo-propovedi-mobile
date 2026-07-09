jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native')

  return {
    __esModule: true,
    default: { View },
    cancelAnimation: () => {},
    Easing: { linear: () => 'linear' },
    useAnimatedStyle: (fn) => (typeof fn === 'function' ? fn() : {}),
    useDerivedValue: (fn) => ({ value: typeof fn === 'function' ? fn() : undefined }),
    useSharedValue: (init) => ({ value: init }),
    withDelay: (_delay, value) => value,
    withRepeat: (value) => value,
    withSequence: (...values) => values[values.length - 1],
    withTiming: (toValue) => toValue,
  }
})
