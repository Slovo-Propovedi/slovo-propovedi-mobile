import { useFocusEffect } from 'expo-router'
import { useCallback, useEffect, useRef } from 'react'

/**
 * Re-runs `refetch` every time the screen regains focus, skipping the initial
 * focus that coincides with the mount fetch (screens load their data in
 * `useEffect`). `refetch` owns its error handling and must stay silent: it must
 * not toggle loading flags, so the previous data stays on screen while the
 * refresh runs.
 *
 * The callback identity is kept stable, and the latest `refetch` is read from a
 * ref — changing filters/id never re-triggers a fetch on its own (useEffect
 * already handles that); only a real focus does.
 * @param refetch - Silent refetch callback.
 */
export const useSilentRefetchOnFocus = (refetch: () => Promise<void>): void => {
  const hasFocusedOnceRef = useRef(false)
  const refetchRef = useRef(refetch)

  useEffect(() => {
    refetchRef.current = refetch
  }, [refetch])

  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedOnceRef.current) {
        hasFocusedOnceRef.current = true
        return
      }

      void refetchRef.current().catch(() => {
        // Silent by contract: `refetch` owns its error handling; swallowing here
        // only prevents a process-level unhandled rejection if a caller forgets.
      })
    }, []),
  )
}
