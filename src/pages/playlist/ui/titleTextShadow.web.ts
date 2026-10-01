import { type TextStyle } from 'react-native'

/**
 * React-native-web deprecates `textShadowColor`/`textShadowOffset`/
 * `textShadowRadius` in favor of the CSS `textShadow` shorthand, so web uses
 * the shorthand string here. See the `.ts` counterpart.
 *
 * The extra `textShadow` property is not part of RN's `TextStyle`, hence the
 * widened type; spreading it into a `TextStyle` is accepted by TypeScript.
 */
export const TITLE_TEXT_SHADOW: { textShadow: string } & TextStyle = {
  textShadow: '0 2px 4px rgba(0, 0, 0, 0.75)',
}
