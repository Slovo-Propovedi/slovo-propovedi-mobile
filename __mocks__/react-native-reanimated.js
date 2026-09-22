jest.mock('react-native-reanimated', () => {
  const { FlatList, View } = require('react-native')

  // Registrations are exposed so tests can drive frames through the callback
  // returned by the hook (mirrors the real FrameCallbackRegistry).
  const frameCallbacks = []

  return {
    __esModule: true,
    __frameCallbacks: frameCallbacks,
    default: { FlatList, View, createAnimatedComponent: Component => Component },
    cancelAnimation: () => {},
    createAnimatedComponent: Component => Component,
    Easing: {
      in: fn => fn,
      inOut: fn => fn,
      linear: () => 'linear',
      out: fn => fn,
      sin: () => 'sin',
    },
    interpolate: p => p,
    ReduceMotion: { Always: 'always', Never: 'never', System: 'system' },
    useAnimatedReaction: () => {
      // No-op: useAnimatedReaction synchronizes shared values from the UI
      // thread to JS state. In tests, we rely on the initial useState value.
      // The hook's isExpanded starts as `true` via useState; collapse/expand
      // are tested directly via their exposed functions.
    },
    useAnimatedProps: fn => (typeof fn === 'function' ? fn() : {}),
    useAnimatedStyle: fn => (typeof fn === 'function' ? fn() : {}),
    useDerivedValue: fn => ({ value: typeof fn === 'function' ? fn() : undefined }),
    useFrameCallback: (callback, autostart = true) => {
      const frameCallback = {
        callback,
        callbackId: frameCallbacks.length,
        isActive: autostart,
        setActive: jest.fn(isActive => {
          frameCallback.isActive = isActive
        }),
      }
      frameCallbacks.push(frameCallback)
      return frameCallback
    },
    useSharedValue: init => ({ value: init }),
    withDelay: (_delay, value) => value,
    withRepeat: value => value,
    withSequence: (...values) => values[values.length - 1],
    withTiming: jest.fn((toValue, _config, callback) => {
      // Animations complete synchronously in tests; invoke the completion
      // callback so exit-animation state (e.g. unmount-after-collapse) is
      // exercised honestly.
      // Intentional divergence: real Reanimated passes `finished=false` when
      // an animation is interrupted; no repo test depends on that semantics.
      if (typeof callback === 'function') callback(true)
      return toValue
    }),
  }
})
