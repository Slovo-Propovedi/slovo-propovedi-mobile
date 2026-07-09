jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View
  const TouchableOpacity = require('react-native').TouchableOpacity
  const { ScrollView } = require('react-native')

  const chainableStub = new Proxy(
    {},
    {
      get: (target, prop) => {
        if (prop === 'then') return undefined
        return () => chainableStub
      },
    },
  )

  return {
    Gesture: {
      Native: () => chainableStub,
      Pan: () => chainableStub,
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
  }
})
