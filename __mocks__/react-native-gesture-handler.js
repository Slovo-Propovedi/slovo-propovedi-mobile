jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View
  const TouchableOpacity = require('react-native').TouchableOpacity
  const { ScrollView } = require('react-native')

  const gestureCallbacks = {}

  const chainableStub = new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === 'then') return undefined
        return () => chainableStub
      },
    },
  )

  const pan = new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === 'then') return undefined
        return callback => {
          gestureCallbacks[String(prop)] = callback
          return pan
        }
      },
    },
  )

  return {
    Gesture: {
      Native: () => chainableStub,
      Pan: () => pan,
    },
    GestureDetector: ({ children }) => children,
    GestureHandlerRootView: View,
    GestureType: {},
    PanGestureHandler: View,
    PanGestureHandlerProps: {},
    ScrollView,
    State: {},
    TouchableOpacity: TouchableOpacity,
    gestureHandlerRootHOC: component => component,
    __gestureMock: {
      pan: () => gestureCallbacks,
      reset: () => {
        Object.keys(gestureCallbacks).forEach(key => delete gestureCallbacks[key])
      },
    },
  }
})