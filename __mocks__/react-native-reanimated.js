jest.mock('react-native-reanimated', () => {
  const React = require('react')
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

  // Real Animated components apply `animatedProps` to the wrapped node on every
  // frame; mirror that by merging them so rendered props are observable in tests.
  const createAnimatedComponent = Component =>
    React.forwardRef((props, ref) => {
      const { animatedProps, ...rest } = props

      return React.createElement(Component, { ...rest, ...animatedProps, ref })
    })

  return {
    __esModule: true,
    __frameCallbacks: frameCallbacks,
    default: { FlatList, ScrollView, View, createAnimatedComponent },
    cancelAnimation: () => {},
    createAnimatedComponent,
    Easing: {
      in: fn => fn,
      inOut: fn => fn,
      linear: () => 'linear',
      out: fn => fn,
      sin: () => 'sin',
    },
    interpolate: p => p,
    interpolateColor: (value, inputRange, outputRange) => {
      // Endpoints keep their exact spelling so colour assertions stay literal;
      // mid values blend the RGB channels of the first and last stops.
      if (value <= inputRange[0]) return outputRange[0]
      if (value >= inputRange[inputRange.length - 1]) {
        return outputRange[outputRange.length - 1]
      }

      const parseHex = color => {
        const match = /^#([0-9a-f]{6})$/i.exec(color)

        if (!match) return null

        const int = parseInt(match[1], 16)

        return [(int >> 16) & 255, (int >> 8) & 255, int & 255]
      }
      const from = parseHex(outputRange[0])
      const to = parseHex(outputRange[outputRange.length - 1])

      if (!from || !to) return outputRange[0]

      const span = inputRange[inputRange.length - 1] - inputRange[0]
      const progress = (value - inputRange[0]) / span
      const channel = index => Math.round(from[index] + (to[index] - from[index]) * progress)

      return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`
    },
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
      // Stable handle per hook instance, mirroring Reanimated's useRef-based
      // return: re-renders must not register a second clock for one surface.
      const holder = React.useRef(null)

      if (holder.current === null) {
        holder.current = {
          callback,
          callbackId: frameCallbacks.length,
          isActive: autostart,
          setActive: jest.fn(isActive => {
            holder.current.isActive = isActive
          }),
        }
        frameCallbacks.push(holder.current)
      }

      return holder.current
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
