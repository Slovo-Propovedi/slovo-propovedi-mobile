jest.mock('react-native-reanimated', () => {
  const { FlatList, ScrollView, View } = require('react-native')

  // Registrations are exposed so tests can drive frames through the callback
  // returned by the hook (mirrors the real FrameCallbackRegistry).
  const frameCallbacks = []

  const createMutable = init => {
    const mutable = {
      get: () => mutable.value,
      set: value => {
        mutable.value = value
      },
      value: init,
    }

    return mutable
  }

  return {
    __esModule: true,
    __frameCallbacks: frameCallbacks,
    default: { FlatList, ScrollView, View, createAnimatedComponent: Component => Component },
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
    useAnimatedScrollHandler: handler =>
      typeof handler === 'function' ? handler : handler.onScroll,
    useAnimatedProps: fn => (typeof fn === 'function' ? fn() : {}),
    useAnimatedStyle: fn => (typeof fn === 'function' ? fn() : {}),
    useDerivedValue: fn => ({ value: typeof fn === 'function' ? fn() : undefined }),
    useEvent: handler => handler,
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
    useSharedValue: createMutable,
    makeMutable: createMutable,
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
