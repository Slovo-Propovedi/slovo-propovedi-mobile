// react-native-web accepts extra CSS props (e.g. `overscrollBehavior`) that the
// React Native `ViewStyle` typings lack. Declared here so web-only wrappers can
// set them without a banned type assertion.
import 'react-native'

declare module 'react-native' {
  interface ViewStyle {
    overscrollBehavior?: 'auto' | 'contain' | 'none'
  }
}
