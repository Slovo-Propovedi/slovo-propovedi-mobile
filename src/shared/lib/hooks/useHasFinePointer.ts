import { useEffect, useState } from 'react'

// A mouse/trackpad is the primary input: such a device cannot pull to refresh.
// Tablets and phones (touch, coarse pointer) do not match.
const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)'

const matchFinePointer = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia(FINE_POINTER_QUERY).matches

/** Whether the primary input is a mouse (desktop web); follows device changes. */
export const useHasFinePointer = (): boolean => {
  const [hasFinePointer, setHasFinePointer] = useState(matchFinePointer)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return

    const query = window.matchMedia(FINE_POINTER_QUERY)
    const onChange = () => setHasFinePointer(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return hasFinePointer
}
