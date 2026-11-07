import { useEffect, useRef } from 'react'
import { Keyboard, Platform, type TextInputInstance } from 'react-native'

/**
 * Focuses the search input once per open session. The field stays mounted while
 * the island fades out, so focus is driven by the open state instead of mount:
 * a closed island must never steal focus from the screen underneath.
 * @param isActive - Whether search is open.
 */
export const useSearchAutofocus = (isActive: boolean) => {
  const inputRef = useRef<TextInputInstance>(null)
  const hasFocusedOnce = useRef(false)

  useEffect(() => {
    if (Platform.OS === 'web') return

    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      // A hide left over from a previous dismissal can arrive right after
      // opening and would kill the autofocus — ignore it until focus is applied.
      if (!hasFocusedOnce.current) return
      inputRef.current?.blur()
    })

    return () => hideSubscription.remove()
  }, [])

  // Focus one frame after opening: on Android a focus request issued before the
  // bar is laid out is dropped, so the keyboard never appears.
  useEffect(() => {
    if (!isActive) {
      inputRef.current?.blur()
      return
    }

    const focusFrame = requestAnimationFrame(() => {
      inputRef.current?.focus()
      hasFocusedOnce.current = true
    })

    return () => cancelAnimationFrame(focusFrame)
  }, [isActive])

  return inputRef
}
