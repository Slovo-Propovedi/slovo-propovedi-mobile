jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View
  const TouchableOpacity = require('react-native').TouchableOpacity

  return {
    GestureHandlerRootView: View,
    PanGestureHandler: View,
    TouchableOpacity: TouchableOpacity,
    State: {},
    PanGestureHandlerProps: {},
    gestureHandlerRootHOC: component => component,
  }
})
