import { useEffect, useState } from 'react'
import { Platform } from 'react-native'

// A mouse/trackpad is the primary input: such a device cannot pull to refresh.
// Tablets and phones (touch, coarse pointer) do not match.
const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)'

// The platform guard is part of the contract: React Native aliases `window` to its
// global object, so a `matchMedia` polyfill on native must never be mistaken for web.
const matchDesktopWeb = (): boolean =>
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia(FINE_POINTER_QUERY).matches

/** Whether the app runs on desktop web with a mouse (follows device changes). */
export const useHasFinePointer = (): boolean => {
  const [hasFinePointer, setHasFinePointer] = useState(matchDesktopWeb)

  useEffect(() => {
    if (
      Platform.OS !== 'web' ||
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    )
      return

    const query = window.matchMedia(FINE_POINTER_QUERY)
    const onChange = () => setHasFinePointer(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return hasFinePointer
}
