import { useEffect, useRef, useState } from 'react'
import { AppState, type AppStateStatus } from 'react-native'

// After ≥5 min in background the UI-thread Reanimated progress can desync,
// leaving an opaque gray container over the mini-player (Issue #61).
// A key increment forces a full remount of the player subtree.
const REMOUNT_THRESHOLD_MS = 5 * 60 * 1000

export const useBackgroundRecovery = (): number => {
  const [recoveryKey, setRecoveryKey] = useState(0)

  // Timestamp of the FIRST non-active transition — guarded so 'inactive'→'background'
  // on iOS does not reset the timer.
  const backgroundEnteredAtRef = useRef<null | number>(null)

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const enteredAt = backgroundEnteredAtRef.current

        if (enteredAt !== null) {
          const elapsed = Date.now() - enteredAt
          backgroundEnteredAtRef.current = null

          if (elapsed > REMOUNT_THRESHOLD_MS) setRecoveryKey(prev => prev + 1)
        }

        return
      }

      // Record timestamp only on the FIRST non-active transition.
      // Subsequent transitions (e.g. inactive→background on iOS) keep the
      // original timestamp so the duration is computed correctly.
      if (backgroundEnteredAtRef.current !== null) return
      backgroundEnteredAtRef.current = Date.now()
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      subscription.remove()
    }
  }, [])

  return recoveryKey
}
