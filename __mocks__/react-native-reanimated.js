jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native')

  return {
    __esModule: true,
    default: { View, createAnimatedComponent: Component => Component },
    cancelAnimation: () => {},
    createAnimatedComponent: Component => Component,
    Easing: { linear: () => 'linear' },
    interpolate: p => p,
    useAnimatedReaction: () => {
      // No-op: useAnimatedReaction synchronizes shared values from the UI
      // thread to JS state. In tests, we rely on the initial useState value.
      // The hook's isExpanded starts as `true` via useState; collapse/expand
      // are tested directly via their exposed functions.
    },
    useAnimatedStyle: fn => (typeof fn === 'function' ? fn() : {}),
    useDerivedValue: fn => ({ value: typeof fn === 'function' ? fn() : undefined }),
    useSharedValue: init => ({ value: init }),
    withDelay: (_delay, value) => value,
    withRepeat: value => value,
    withSequence: (...values) => values[values.length - 1],
    withTiming: toValue => toValue,
  }
})
