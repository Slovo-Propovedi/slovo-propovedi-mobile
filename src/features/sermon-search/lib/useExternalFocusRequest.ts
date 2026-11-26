import { useEffect, useRef } from 'react'
import { type TextInputInstance } from 'react-native'

interface FieldRef {
  current: null | TextInputInstance
}

/**
 * Focuses the field once per external focus request. The nonce seeds the last
 * handled value so a stale request is not replayed when the bar remounts, and a
 * redundant bump on an already-focused field stays a no-op.
 * @param focusRequest - Monotonic request counter from `searchFocusRequestAtom`.
 * @param fieldRef - Ref to the field the request targets.
 * @param isEnabled - Whether this field may take focus; a disabled field still consumes the request.
 */
export const useExternalFocusRequest = (
  focusRequest: number,
  fieldRef: FieldRef,
  isEnabled: boolean,
) => {
  const lastHandledRef = useRef(focusRequest)

  useEffect(() => {
    if (focusRequest === lastHandledRef.current) return

    lastHandledRef.current = focusRequest

    if (!isEnabled) return

    fieldRef.current?.focus()
  }, [focusRequest, fieldRef, isEnabled])
}
