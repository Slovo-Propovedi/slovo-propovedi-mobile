import { type TextStyle } from 'react-native'

/**
 * Native React Native does not support the `textShadow` shorthand, so the
 * individual props are kept here. On web they are deprecated — the bundler
 * resolves `titleTextShadow.web.ts` instead, which uses the shorthand.
 */
export const TITLE_TEXT_SHADOW: TextStyle = {
  textShadowColor: 'rgba(0, 0, 0, 0.75)',
  textShadowOffset: { height: 2, width: 0 },
  textShadowRadius: 4,
}
