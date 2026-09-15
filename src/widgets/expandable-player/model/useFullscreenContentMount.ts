import { useEffect, useRef, useState } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { COLLAPSE_DURATION_MS } from './expandDurations'

/**
 * Tracks whether the fullscreen content should stay mounted.
 * Mounts immediately on expand; on collapse stays mounted through the
 * collapse animation, then unmounts after COLLAPSE_DURATION_MS. Re-expanding
 * during the window cancels the pending unmount. On foreground resume the
 * flag snaps to the expanded state to mirror useAppStateSnap (Issue #100).
 * @param expanded Whether the player is currently expanded.
 */
export const useFullscreenContentMount = (expanded: boolean): boolean => {
  const [isMounted, setIsMounted] = useState(expanded)
  const unmountTimerRef = useRef<null | ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    if (expanded) {
      if (unmountTimerRef.current) {
        clearTimeout(unmountTimerRef.current)
        unmountTimerRef.current = null
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks-extra/no-direct-set-state-in-use-effect -- re-mount after the collapse timer fired
      setIsMounted(true)
      return
    }
    // Early exit: already unmounted — no collapse timer needed (e.g. cold mount with expanded=false)
    if (!isMounted) return
    unmountTimerRef.current = setTimeout(() => {
      unmountTimerRef.current = null
      setIsMounted(false)
    }, COLLAPSE_DURATION_MS)
    return () => {
      if (unmountTimerRef.current) {
        clearTimeout(unmountTimerRef.current)
        unmountTimerRef.current = null
      }
    }
  }, [expanded, isMounted])

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState !== 'active') return
      if (unmountTimerRef.current) {
        clearTimeout(unmountTimerRef.current)
        unmountTimerRef.current = null
      }
      setIsMounted(expanded)
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      subscription.remove()
    }
  }, [expanded])

  return isMounted
}
