import { useEffect, useRef } from 'react'
import { Keyboard, Platform, type TextInput } from 'react-native'

export const useSearchAutofocus = () => {
  const inputRef = useRef<TextInput>(null)
  const hasFocusedOnMount = useRef(false)

  useEffect(() => {
    if (Platform.OS === 'web') return

    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      // A hide left over from a previous dismissal can arrive right after
      // mount and would kill the autofocus — ignore it until focus is applied.
      if (!hasFocusedOnMount.current) return
      inputRef.current?.blur()
    })

    return () => hideSubscription.remove()
  }, [])

  // Focus one frame after mount: on Android a focus request issued before the
  // bar is laid out is dropped, so the keyboard never appears.
  useEffect(() => {
    const focusFrame = requestAnimationFrame(() => {
      inputRef.current?.focus()
      hasFocusedOnMount.current = true
    })

    return () => cancelAnimationFrame(focusFrame)
  }, [])

  return inputRef
}
