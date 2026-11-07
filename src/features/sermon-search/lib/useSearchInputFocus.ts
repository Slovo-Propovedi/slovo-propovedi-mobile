import { useEffect, useRef } from 'react'
import { Keyboard, Platform, type TextInputInstance } from 'react-native'

/**
 * Owns the search field's node ref. Focus stays user-driven: nothing here
 * focuses on mount or open. The hook only releases the field when search closes
 * or the keyboard is dismissed, so the caret never lingers behind a hidden bar.
 * @param isOpen - Whether search is open.
 * @returns Ref to attach to the field.
 */
export const useSearchInputFocus = (isOpen: boolean) => {
  const inputRef = useRef<TextInputInstance>(null)

  useEffect(() => {
    if (isOpen) return

    inputRef.current?.blur()
  }, [isOpen])

  useEffect(() => {
    if (Platform.OS === 'web') return

    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      inputRef.current?.blur()
    })

    return () => hideSubscription.remove()
  }, [])

  return inputRef
}
