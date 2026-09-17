import { Platform } from 'react-native'

const ESCAPE_KEY = 'Escape'

interface KeyPressEventLike {
  altKey?: boolean
  ctrlKey?: boolean
  key?: string
  metaKey?: boolean
  nativeEvent?: { key?: string }
  shiftKey?: boolean
}

const getPressedKey = (event: KeyPressEventLike): string => {
  if (typeof event.key === 'string') return event.key
  return event.nativeEvent?.key ?? ''
}

// RNW TextInput does not forward onKeyDown (it is overwritten by RNW's own
// handler); onKeyPress is the only key event prop that reaches the input, and
// on web it receives the raw DOM KeyboardEvent.
export const useSearchEscapeKey = (onEscape: () => void) => {
  const handleKeyPress = (event: KeyPressEventLike) => {
    if (Platform.OS !== 'web') return
    if (getPressedKey(event) !== ESCAPE_KEY) return
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return
    onEscape()
  }

  return handleKeyPress
}
