import { useEffect, useRef } from 'react'
import { Keyboard, Platform, type TextInputInstance } from 'react-native'

/**
 * Owns the search field's node ref. Focus stays user-driven: nothing here
 * focuses on mount or open. The hook only releases the field when the pill is
 * hidden (search closed, or a collapsed bar with an empty query), so neither
 * the caret nor the keyboard lingers behind an invisible field.
 * @param isFieldVisible - Whether the search pill is currently on screen.
 * @returns Ref to attach to the field.
 */
export const useSearchInputFocus = (isFieldVisible: boolean) => {
  const inputRef = useRef<TextInputInstance>(null)

  useEffect(() => {
    if (isFieldVisible) return

    inputRef.current?.blur()
  }, [isFieldVisible])

  useEffect(() => {
    if (Platform.OS === 'web') return

    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      inputRef.current?.blur()
    })

    return () => hideSubscription.remove()
  }, [])

  return inputRef
}
