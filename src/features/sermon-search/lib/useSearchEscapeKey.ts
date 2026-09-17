import { Platform } from 'react-native'
import { isEscapeKey } from 'shared/lib/escape-key'

interface KeyPressEventLike {
  altKey?: boolean
  ctrlKey?: boolean
  key?: string
  metaKey?: boolean
  nativeEvent?: { key?: string }
  shiftKey?: boolean
}

// RNW TextInput does not forward onKeyDown (it is overwritten by RNW's own
// handler); onKeyPress is the only key event prop that reaches the input, and
// on web it receives the raw DOM KeyboardEvent.
export const useSearchEscapeKey = (onEscape: () => void) => {
  const handleKeyPress = (event: KeyPressEventLike) => {
    if (Platform.OS !== 'web') return
    if (!isEscapeKey(event)) return
    onEscape()
  }

  return handleKeyPress
}
